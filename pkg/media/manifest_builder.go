package media

import (
	"context"
	"encoding/json"
	"fmt"

	"git.stream.place/streamplace/c2pa-go/pkg/c2pa"
	"stream.place/streamplace/pkg/aqtime"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/model"
	"stream.place/streamplace/pkg/streamplace"
)

type ManifestBuilder struct {
	model model.Model
}

func NewManifestBuilder(model model.Model) *ManifestBuilder {
	return &ManifestBuilder{
		model: model,
	}
}

func (mb *ManifestBuilder) BuildManifest(ctx context.Context, streamerName string, start int64) (*c2pa.ManifestDefinition, error) {
	// Start with base manifest
	mani := obj{
		"title": fmt.Sprintf("Livestream Segment at %s", aqtime.FromMillis(start)),
		"assertions": []obj{
			{
				"label": "c2pa.actions",
				"data": obj{
					"actions": []obj{
						{"action": "c2pa.created"},
						{"action": "c2pa.published"},
					},
				},
			},
			{
				"label": StreamplaceMetadata,
				"data": obj{
					"@context": obj{
						"dc": "http://purl.org/dc/elements/1.1/",
						"Iptc4xmpExt": "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
						"photoshop": "http://ns.adobe.com/photoshop/1.0/",
					},
					"dc:creator": streamerName,
					// TODO: Add the title of the livestream. This should come from the livestream record.
					"dc:title":   []string{"livestream"},
					"dc:date":    []string{aqtime.FromMillis(start).String()},
				},
			},
		},
	}

	// Add database metadata if available
	if mb.model != nil {
		metadata, err := mb.model.GetDefaultMetadata(ctx, streamerName)
		if err != nil {
			log.Warn(ctx, "ManifestBuilder: failed to retrieve metadata, using defaults", "error", err, "did", streamerName)
		} else if metadata != nil {
			streamplaceMetadata, err := metadata.ToStreamplaceDefaultMetadata()
			if err != nil {
				log.Warn(ctx, "ManifestBuilder: failed to convert metadata, using defaults", "error", err, "did", streamerName)
			} else {
				mani = mb.enhanceManifestWithMetadata(mani, streamplaceMetadata)
			}
		}
	}


	// Convert to C2PA manifest
	manifestBs, err := json.Marshal(mani)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal manifest: %w", err)
	}

	var manifest c2pa.ManifestDefinition
	if err := json.Unmarshal(manifestBs, &manifest); err != nil {
		return nil, fmt.Errorf("failed to unmarshal manifest: %w", err)
	}

	return &manifest, nil
}

func (mb *ManifestBuilder) enhanceManifestWithMetadata(mani obj, metadata *streamplace.DefaultMetadata) obj {
	if metadata.ContentRights != nil {
		// TODO: We are currently validating the creator in the ValidateMP4 function to be the streamer DID
		// if metadata.ContentRights.Creator != nil {
		//	mani["assertions"].([]obj)[1]["data"].(obj)["dc:creator"] = *metadata.ContentRights.Creator
		// }

		// Copyright Notice
		if metadata.ContentRights.CopyrightNotice != nil {
			mani["assertions"].([]obj)[1]["data"].(obj)["dc:rights"] = *metadata.ContentRights.CopyrightNotice
		}

		// Copyright Year
		if metadata.ContentRights.CopyrightYear != nil {
			mani["assertions"].([]obj)[1]["data"].(obj)["Iptc4xmpExt:CopyrightYear"] = *metadata.ContentRights.CopyrightYear
		}

		// Credit Line
		if metadata.ContentRights.CreditLine != nil {
			mani["assertions"].([]obj)[1]["data"].(obj)["photoshop:Credit"] = *metadata.ContentRights.CreditLine
		}

		// Linked Enc Rights Expr
		if metadata.ContentRights.License != nil {
			mani["assertions"].([]obj)[1]["data"].(obj)["Iptc4xmpExt:LinkedEncRightsExpr"] = *metadata.ContentRights.License
		}
	}

	if len(metadata.ContentWarnings) > 0 {
		mani["assertions"].([]obj)[1]["data"].(obj)["Iptc4xmpExt:ContentWarning"] = metadata.ContentWarnings
	}

	if metadata.DistributionPolicy != nil {
		mani["assertions"].([]obj)[1]["data"].(obj)["distributionPolicy"] = metadata.DistributionPolicy
	}

	return mani
} 