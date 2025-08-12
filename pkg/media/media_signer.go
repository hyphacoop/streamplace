package media

import (
	"bytes"
	"context"
	"crypto"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"git.stream.place/streamplace/c2pa-go/pkg/c2pa"
	"go.opentelemetry.io/otel"
	"stream.place/streamplace/pkg/aqio"
	"stream.place/streamplace/pkg/aqtime"
	"stream.place/streamplace/pkg/atproto"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/crypto/aqpub"
	"stream.place/streamplace/pkg/crypto/signers"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/model"
	"stream.place/streamplace/pkg/spmetrics"
	"stream.place/streamplace/pkg/streamplace"
)

type MediaSigner interface {
	SignMP4(ctx context.Context, input io.ReadSeeker, start int64) ([]byte, error)
	SignMP4WithLivestream(ctx context.Context, input io.ReadSeeker, start int64, livestreamCID string) ([]byte, error)
	Pub() aqpub.Pub
	Streamer() string
	DID() string
}

type MediaSignerLocal struct {
	StreamerName string
	Signer       crypto.Signer
	AQPub        aqpub.Pub
	Cert         []byte
	TAURL        string
	did          string
	Model        model.Model
}

func prepareCert(ctx context.Context, cli *config.CLI, signer crypto.Signer) ([]byte, string, error) {
	pub, err := aqpub.FromPublicKey(signer.Public().(*ecdsa.PublicKey))
	if err != nil {
		return nil, "", err
	}
	fSlice := []string{pub.String(), CertFile}
	exists, err := cli.DataFileExists(fSlice)
	if err != nil {
		return nil, "", err
	}
	if !exists {
		cert, err := signers.GenerateES256KCert(signer)
		if err != nil {
			return nil, "", err
		}
		r := bytes.NewReader(cert)
		err = cli.DataFileWrite(fSlice, r, false)
		if err != nil {
			return nil, "", err
		}
		log.Log(ctx, "wrote new media signing certificate", "file", filepath.Join(pub.String(), CertFile))
	}
	buf := bytes.Buffer{}
	if err := cli.DataFileRead(fSlice, &buf); err != nil {
		return nil, "", err
	}

	fPath := cli.DataFilePath(fSlice)
	cert := buf.Bytes()
	return cert, fPath, nil
}

// MakeMediaSigner creates a media signer without database integration (legacy)
func MakeMediaSigner(ctx context.Context, cli *config.CLI, streamer string, signer crypto.Signer) (MediaSigner, error) {
	return MakeMediaSignerWithModel(ctx, cli, streamer, signer, nil)
}

// MakeMediaSignerWithModel creates a media signer with database integration for LiveMetadata
func MakeMediaSignerWithModel(ctx context.Context, cli *config.CLI, streamer string, signer crypto.Signer, model model.Model) (MediaSigner, error) {
	cert, _, err := prepareCert(ctx, cli, signer)
	if err != nil {
		return nil, err
	}
	pub, err := aqpub.FromPublicKey(signer.Public().(*ecdsa.PublicKey))
	if err != nil {
		return nil, err
	}
	did, err := atproto.ParsePubKey(signer.Public().(*ecdsa.PublicKey))
	if err != nil {
		return nil, err
	}
	return &MediaSignerLocal{
		Signer:       signer,
		Cert:         cert,
		StreamerName: streamer,
		TAURL:        cli.TAURL,
		AQPub:        pub,
		did:          did.DIDKey(),
		Model:        model,
	}, nil
}

func (ms *MediaSignerLocal) Streamer() string {
	return ms.StreamerName
}

func (ms *MediaSignerLocal) SignMP4(ctx context.Context, input io.ReadSeeker, start int64) ([]byte, error) {
	startTime := time.Now()
	ctx, span := otel.Tracer("signer").Start(ctx, "SignMP4")
	defer span.End()

	// Create base manifest and sign
	title := "livestream"
	manifest := ms.createBaseManifest(start, title)
	return ms.signWithManifest(ctx, input, manifest, startTime)
}

func (ms *MediaSignerLocal) Pub() aqpub.Pub {
	return ms.AQPub
}

func (ms *MediaSignerLocal) DID() string {
	return ms.did
}

// SignMP4WithLivestream signs MP4 with enhanced metadata from livestream record
func (ms *MediaSignerLocal) SignMP4WithLivestream(ctx context.Context, input io.ReadSeeker, start int64, livestreamCID string) ([]byte, error) {
	startTime := time.Now()
	ctx, span := otel.Tracer("signer").Start(ctx, "SignMP4WithLivestream")
	defer span.End()

	// Create base manifest
	title := "livestream"
	baseManifest := ms.createBaseManifest(start, title)

	// Try to enhance with LiveMetadata
	if ms.Model != nil && livestreamCID != "" {
		enhancedManifest, err := ms.enhanceManifestWithLiveMetadata(ctx, baseManifest, livestreamCID, start)
		if err != nil {
			log.Debug(ctx, "failed to enhance manifest with metadata, using base manifest", "err", err)
		} else {
			baseManifest = enhancedManifest
		}
	}

	return ms.signWithManifest(ctx, input, baseManifest, startTime)
}

// createBaseManifest creates the standard manifest without LiveMetadata
func (ms *MediaSignerLocal) createBaseManifest(start int64, title string) obj {
	return obj{
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
					},
					"dc:creator": ms.StreamerName,
					"dc:title":   []string{title},
					"dc:date":    []string{aqtime.FromMillis(start).String()},
				},
			},
		},
	}
}

// enhanceManifestWithLiveMetadata adds LiveMetadata to the base manifest
func (ms *MediaSignerLocal) enhanceManifestWithLiveMetadata(ctx context.Context, manifest obj, livestreamCID string, start int64) (obj, error) {
	// Get livestream metadata from database
	metadata, err := ms.Model.GetLiveMetadataByLivestreamRef(ctx, livestreamCID)
	if err != nil {
		return manifest, nil // No metadata found, return base manifest
	}

	// Parse the CBOR record to get full metadata
	var liveMetadata *streamplace.LiveMetadata
	liveMetadata, err = metadata.ToStreamplaceLiveMetadata()
	if err != nil {
		return manifest, fmt.Errorf("failed to parse livestream metadata: %w", err)
	}

	assertions := manifest["assertions"].([]obj)

	// Add content warnings if present
	if len(liveMetadata.ContentWarnings) > 0 {
		contentWarningAssertion := obj{
			"label": "iptc.content_warning",
			"data": obj{
				"@context": obj{
					"iptc": "https://cv.iptc.org/newscodes/contentwarning/",
				},
				"contentWarnings": liveMetadata.ContentWarnings,
				"scheme":          "https://cv.iptc.org/newscodes/contentwarning/",
			},
		}
		assertions = append(assertions, contentWarningAssertion)
	}

	// Add rights information if present
	if liveMetadata.Rights != nil {
		rightsData := obj{
			"@context": obj{
				"xmpRights": "http://ns.adobe.com/xap/1.0/rights/",
				"photoshop": "http://ns.adobe.com/photoshop/1.0/",
			},
		}

		if liveMetadata.Rights.Attribution != nil {
			rightsData["photoshop:Credit"] = *liveMetadata.Rights.Attribution
		}
		if liveMetadata.Rights.Copyright != nil {
			rightsData["photoshop:CopyrightNotice"] = *liveMetadata.Rights.Copyright
		}
		if liveMetadata.Rights.CustomLicense != nil {
			rightsData["xmpRights:UsageTerms"] = *liveMetadata.Rights.CustomLicense
		}

		rightsAssertion := obj{
			"label": "c2pa.rights",
			"data":  rightsData,
		}
		assertions = append(assertions, rightsAssertion)
	}

	// Add distribution policy if present
	if liveMetadata.DistributionPolicy != nil {
		policyData := obj{
			"allowBroadcast": liveMetadata.DistributionPolicy.AllowBroadcast,
			"allowArchive":   liveMetadata.DistributionPolicy.AllowArchive,
			"broadcastUntil": liveMetadata.DistributionPolicy.BroadcastUntil,
		}

		if liveMetadata.DistributionPolicy.CustomDuration != nil {
			policyData["customDuration"] = *liveMetadata.DistributionPolicy.CustomDuration
		}

		distributionAssertion := obj{
			"label": "place.stream.distribution/v1",
			"data": obj{
				"@context": obj{
					"sp": "https://stream.place/c2pa/",
				},
				"sp:distributionPolicy": policyData,
			},
		}
		assertions = append(assertions, distributionAssertion)
	}

	// Add metadata provenance
	provenanceAssertion := obj{
		"label": "place.stream.metadata_provenance/v1",
		"data": obj{
			"@context": obj{
				"sp": "https://stream.place/c2pa/",
			},
			"sp:metadataSource": obj{
				"cid":           metadata.CID,
				"uri":           metadata.URI,
				"createdAt":     metadata.CreatedAt.Format(time.RFC3339),
				"repoDID":       metadata.RepoDID,
				"livestreamRef": metadata.LivestreamRefCID,
				"segmentStart":  aqtime.FromMillis(start).String(),
			},
		},
	}
	assertions = append(assertions, provenanceAssertion)

	manifest["assertions"] = assertions
	return manifest, nil
}

// signWithManifest performs the actual C2PA signing with the given manifest
func (ms *MediaSignerLocal) signWithManifest(ctx context.Context, input io.ReadSeeker, manifest obj, startTime time.Time) ([]byte, error) {
	ctx, span := otel.Tracer("signer").Start(ctx, "SignMP4_MarshalManifest")
	manifestBs, err := json.Marshal(manifest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal manifest: %w", err)
	}
	var c2paManifest c2pa.ManifestDefinition
	err = json.Unmarshal(manifestBs, &c2paManifest)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal manifest: %w", err)
	}
	span.End()

	ctx, span = otel.Tracer("signer").Start(ctx, "SignMP4_GetSigningAlgorithm")
	alg, err := c2pa.GetSigningAlgorithm(string(c2pa.ES256K))
	if err != nil {
		return nil, fmt.Errorf("failed to get signing algorithm: %w", err)
	}
	span.End()

	ctx, span = otel.Tracer("signer").Start(ctx, "SignMP4_NewBuilder")
	b, err := c2pa.NewBuilder(&c2paManifest, &c2pa.BuilderParams{
		Cert:      ms.Cert,
		Signer:    ms.Signer,
		Algorithm: alg,
		TAURL:     ms.TAURL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create C2PA builder: %w", err)
	}
	span.End()

	ctx, span = otel.Tracer("signer").Start(ctx, "SignMP4_Sign")
	output := &aqio.ReadWriteSeeker{}
	err = b.Sign(input, output, "video/mp4")
	if err != nil {
		return nil, fmt.Errorf("failed to sign MP4: %w", err)
	}
	span.End()

	ctx, span = otel.Tracer("signer").Start(ctx, "SignMP4_OutputBytes")
	defer ctx.Done()
	bs, err := output.Bytes()
	if err != nil {
		return nil, fmt.Errorf("failed to get output bytes: %w", err)
	}
	span.End()
	spmetrics.SigningDuration.WithLabelValues(ms.StreamerName).Observe(float64(time.Since(startTime).Milliseconds()))
	return bs, nil
}
