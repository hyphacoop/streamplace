package model

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/bluesky-social/indigo/atproto/syntax"
	"stream.place/streamplace/pkg/spid"
	"stream.place/streamplace/pkg/streamplace"
)

type BroadcastOrigin struct {
	URI             string    `gorm:"primaryKey;column:uri"`
	CID             string    `gorm:"column:cid"`
	RepoDID         string    `gorm:"column:repo_did"`
	Repo            *Repo     `gorm:"foreignKey:DID;references:RepoDID"`
	StreamerRepoDID string    `gorm:"column:streamer_repo_did;index:idx_streamer_repo_did_updated_at,priority:1"`
	StreamerRepo    *Repo     `gorm:"foreignKey:DID;references:StreamerRepoDID"`
	ServerRepoDID   string    `gorm:"column:server_repo_did;index:idx_server_repo_did_updated_at,priority:1"`
	UpdatedAt       time.Time `gorm:"column:updated_at;index:idx_streamer_repo_did_updated_at,priority:2;index:idx_server_repo_did_updated_at,priority:2"`
	Record          []byte    `gorm:"column:record"`
}

func (bo *BroadcastOrigin) TableName() string {
	return "broadcast_origins"
}

func (m *DBModel) UpdateBroadcastOrigin(ctx context.Context, origin *streamplace.BroadcastOrigin, aturi syntax.ATURI) error {
	repoDID := aturi.Authority().String()
	cid, err := spid.GetCID(origin)
	if err != nil {
		return fmt.Errorf("failed to get CID: %w", err)
	}
	validATURI := fmt.Sprintf("at://%s/place.stream.broadcast.origin/%s::%s", repoDID, origin.Streamer, origin.Server)
	if validATURI != aturi.String() {
		return fmt.Errorf("invalid ATURI: %s != %s", validATURI, aturi.String())
	}
	buf := bytes.Buffer{}
	err = origin.MarshalCBOR(&buf)
	if err != nil {
		return fmt.Errorf("failed to marshal origin: %w", err)
	}
	bo := &BroadcastOrigin{
		URI:             validATURI,
		CID:             cid.String(),
		StreamerRepoDID: origin.Streamer,
		ServerRepoDID:   origin.Server,
		UpdatedAt:       time.Now(),
		Record:          buf.Bytes(),
	}
	return m.DB.Save(bo).Error
}
