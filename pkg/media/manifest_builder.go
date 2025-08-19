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

// ManifestBuilder is responsible for creating C2PA (Content Credentials) manifests
// for livestream segments.
// The builder creates manifests that include:
// - Basic livestream information (title, creator, date)
// - Content rights and copyright information
// - Content warnings for sensitive material
// - Distribution policies
// - C2PA action history (created, published)
// The manifest is meant to align closely with the IPTC Video Metadata Recommendations.
// See https://iptc.org/std/videometadatahub/recommendation/IPTC-VideoMetadataHub-props-Rec_1.6.html
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
						"dc":          "http://purl.org/dc/elements/1.1/",
						"Iptc4xmpExt": "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
						"photoshop":   "http://ns.adobe.com/photoshop/1.0/",
						"xmpRights":   "http://ns.adobe.com/xap/1.0/rights/",
					},
					"dc:creator": streamerName,
					// TODO: Add the title of the livestream. This should come from the livestream record.
					"dc:title": []string{"livestream"},
					"dc:date":  []string{aqtime.FromMillis(start).String()},
				},
			},
		},
	}

	// Add database metadata if available
	if mb.model != nil {
		metadata, err := mb.model.GetMetadataConfiguration(ctx, streamerName)
		if err != nil {
			log.Warn(ctx, "ManifestBuilder: failed to retrieve metadata, using defaults", "error", err, "did", streamerName)
		} else if metadata != nil {
			streamplaceMetadata, err := metadata.ToStreamplaceMetadataConfiguration()
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

func (mb *ManifestBuilder) enhanceManifestWithMetadata(mani obj, metadata *streamplace.MetadataConfiguration) obj {
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

		// Build the license field
		if metadata.ContentRights.License != nil {
			// Map internal license codes to known licenses
			var licenseCodeMap = map[string]string{
				"place.stream.metadata.configuration#cc0_1__0":         "http://creativecommons.org/publicdomain/zero/1.0/",
				"place.stream.metadata.configuration#cc-by_4__0":       "http://creativecommons.org/licenses/by/4.0/",
				"place.stream.metadata.configuration#cc-by-sa_4__0":    "http://creativecommons.org/licenses/by-sa/4.0/",
				"place.stream.metadata.configuration#cc-by-nc_4__0":    "http://creativecommons.org/licenses/by-nc/4.0/",
				"place.stream.metadata.configuration#cc-by-nc-sa_4__0": "http://creativecommons.org/licenses/by-nc-sa/4.0/",
				"place.stream.metadata.configuration#cc-by-nd_4__0":    "http://creativecommons.org/licenses/by-nd/4.0/",
				"place.stream.metadata.configuration#cc-by-nc-nd_4__0": "http://creativecommons.org/licenses/by-nc-nd/4.0/",
			}
			if mappedCode, exists := licenseCodeMap[*metadata.ContentRights.License]; exists {
				// it's a known linked license, so we can use the mapped code
				mani["assertions"].([]obj)[1]["data"].(obj)["Iptc4xmpExt:LinkedEncRightsExpr"] = mappedCode
			} else {
				// This is either an unknown or an unlinked license, so we need to put it in the UsageTerms field
				// which allows for licensing terms expressed in free text
				if *metadata.ContentRights.License == "place.stream.metadata.configuration#all-rights-reserved" {
					// if all rights reserved, we can put the string "All rights reserved" in the UsageTerms field
					mani["assertions"].([]obj)[1]["data"].(obj)["xmpRights:UsageTerms"] = "All rights reserved"
				} else {
					// it's an unknown license, so we need to put it directly in the UsageTerms field
					mani["assertions"].([]obj)[1]["data"].(obj)["xmpRights:UsageTerms"] = *metadata.ContentRights.License
				}
			}
		}
	}

	if metadata.ContentWarnings != nil && len(metadata.ContentWarnings.Warnings) > 0 {
		// Map internal warning codes to C2PA warning codes
		var warningCodeMap = map[string]string{
			"place.stream.metadata.configuration#death":           "cwarn:death",
			"place.stream.metadata.configuration#drugUse":         "cwarn:drugUse",
			"place.stream.metadata.configuration#fantasyViolence": "cwarn:fantasyViolence",
			"place.stream.metadata.configuration#flashingLights":  "cwarn:flashingLights",
			"place.stream.metadata.configuration#language":        "cwarn:language",
			"place.stream.metadata.configuration#nudity":          "cwarn:nudity",
			"place.stream.metadata.configuration#PII":             "cwarn:PII",
			"place.stream.metadata.configuration#sexuality":       "cwarn:sexuality",
			"place.stream.metadata.configuration#suffering":       "cwarn:suffering",
			"place.stream.metadata.configuration#violence":        "cwarn:violence",
		}

		for i, warning := range metadata.ContentWarnings.Warnings {
			if mappedCode, exists := warningCodeMap[warning]; exists {
				metadata.ContentWarnings.Warnings[i] = mappedCode
			}
			// Unknown warnings remain unchanged
		}
		mani["assertions"].([]obj)[1]["data"].(obj)["Iptc4xmpExt:ContentWarning"] = metadata.ContentWarnings.Warnings
	}

	if metadata.DistributionPolicy != nil {
		mani["assertions"].([]obj)[1]["data"].(obj)["distributionPolicy"] = metadata.DistributionPolicy
	}

	return mani
}
