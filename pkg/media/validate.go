package media

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"go.opentelemetry.io/otel"
	"stream.place/streamplace/pkg/aqtime"
	c2patypes "stream.place/streamplace/pkg/c2patypes"
	"stream.place/streamplace/pkg/constants"
	"stream.place/streamplace/pkg/crypto/signers"
	"stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/model"
)

type ManifestAndCert struct {
	Manifest c2patypes.Manifest `json:"manifest"`
	Cert     string             `json:"cert"`
}

func (mm *MediaManager) ValidateMP4(ctx context.Context, input io.Reader) error {
	ctx, span := otel.Tracer("signer").Start(ctx, "ValidateMP4")
	defer span.End()
	buf, err := io.ReadAll(input)
	if err != nil {
		return err
	}
	var maniCert ManifestAndCert
	maniStr, err := iroh_streamplace.GetManifestAndCert(buf)
	if err != nil {
		return err
	}
	err = json.Unmarshal([]byte(maniStr), &maniCert)
	if err != nil {
		return err
	}
	pub, err := signers.ParseES256KCert([]byte(maniCert.Cert))
	if err != nil {
		return err
	}
	meta, err := ParseSegmentAssertions(ctx, &maniCert.Manifest)
	if err != nil {
		return err
	}
	mediaData, err := ParseSegmentMediaData(ctx, buf)
	if err != nil {
		return err
	}
	// special case for test signers that are only signed with a key
	var repoDID string
	var signingKeyDID string
	if strings.HasPrefix(meta.Creator, constants.DID_KEY_PREFIX) {
		signingKeyDID = meta.Creator
		repoDID = meta.Creator
	} else {
		repo, err := mm.atsync.SyncBlueskyRepoCached(ctx, meta.Creator, mm.model)
		if err != nil {
			return err
		}
		signingKey, err := mm.model.GetSigningKey(ctx, pub.DIDKey(), repo.DID)
		if err != nil {
			return err
		}
		if signingKey == nil {
			return fmt.Errorf("no signing key found for %s", pub.DIDKey())
		}
		repoDID = repo.DID
		signingKeyDID = signingKey.DID
	}

	err = mm.cli.StreamIsAllowed(repoDID)
	if err != nil {
		return fmt.Errorf("got valid segment, but user %s is not allowed: %w", repoDID, err)
	}
	fd, err := mm.cli.SegmentFileCreate(repoDID, meta.StartTime, "mp4")
	if err != nil {
		return err
	}
	defer fd.Close()
	go mm.replicator.NewSegment(ctx, buf)
	r := bytes.NewReader(buf)
	if _, err := io.Copy(fd, r); err != nil {
		return err
	}
	seg := &model.Segment{
		ID:            *maniCert.Manifest.Label,
		SigningKeyDID: signingKeyDID,
		RepoDID:       repoDID,
		StartTime:     meta.StartTime.Time(),
		Title:         meta.Title,
		Size:          len(buf),
		MediaData:     mediaData,
	}
	mm.newSegmentSubsMutex.RLock()
	defer mm.newSegmentSubsMutex.RUnlock()
	not := &NewSegmentNotification{
		Segment:  seg,
		Data:     buf,
		Metadata: meta,
	}
	for _, ch := range mm.newSegmentSubs {
		go func() { ch <- not }()
	}
	aqt := aqtime.FromTime(meta.StartTime.Time())
	log.Log(ctx, "successfully ingested segment", "user", repoDID, "signingKey", signingKeyDID, "timestamp", aqt.FileSafeString(), "segmentID", *maniCert.Manifest.Label)
	return nil
}
