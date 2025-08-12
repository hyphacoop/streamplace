package model

import (
	"context"
	"fmt"
	"time"

	lexutil "github.com/bluesky-social/indigo/lex/util"
	"gorm.io/gorm"
	"stream.place/streamplace/pkg/streamplace"
)

type LiveMetadata struct {
	CID        string    `json:"cid" gorm:"primaryKey;column:cid"`
	URI        string    `json:"uri"`
	CreatedAt  time.Time `json:"createdAt" gorm:"column:created_at;index:idx_repo_created,priority:2"`
	Record     *[]byte   `json:"record"`
	RepoDID    string    `json:"repoDID" gorm:"column:repo_did;index:idx_repo_created,priority:1"`
	Repo       *Repo     `json:"repo,omitempty" gorm:"foreignKey:DID;references:RepoDID"`
	
	// Parsed fields for efficient querying and C2PA signing
	LivestreamRefCID     *string `json:"livestreamRefCid,omitempty" gorm:"column:livestream_ref_cid;index:idx_livestream_ref"`
	LivestreamRefURI     *string `json:"livestreamRefUri,omitempty" gorm:"column:livestream_ref_uri"`
	HasContentWarnings   bool    `json:"hasContentWarnings" gorm:"column:has_content_warnings;index:idx_content_warnings"`
	ContentWarningsCount int     `json:"contentWarningsCount" gorm:"column:content_warnings_count"`
	AllowBroadcast       *bool   `json:"allowBroadcast,omitempty" gorm:"column:allow_broadcast"`
	AllowArchive         *bool   `json:"allowArchive,omitempty" gorm:"column:allow_archive"`
	BroadcastUntil       *string `json:"broadcastUntil,omitempty" gorm:"column:broadcast_until"`
	HasRights            bool    `json:"hasRights" gorm:"column:has_rights"`
	License              *string `json:"license,omitempty" gorm:"column:license"`
}

// ToStreamplaceLiveMetadata converts the model to streamplace format for API responses
func (lm *LiveMetadata) ToStreamplaceLiveMetadata() (*streamplace.LiveMetadata, error) {
	if lm.Record == nil {
		return nil, fmt.Errorf("no record data available")
	}
	
	rec, err := lexutil.CborDecodeValue(*lm.Record)
	if err != nil {
		return nil, fmt.Errorf("error decoding live metadata record: %w", err)
	}
	
	metadata, ok := rec.(*streamplace.LiveMetadata)
	if !ok {
		return nil, fmt.Errorf("record is not a LiveMetadata type")
	}
	
	return metadata, nil
}

// GetContentWarnings extracts content warnings from the CBOR record
func (lm *LiveMetadata) GetContentWarnings() ([]string, error) {
	metadata, err := lm.ToStreamplaceLiveMetadata()
	if err != nil {
		return nil, err
	}
	return metadata.ContentWarnings, nil
}

// GetDistributionPolicy extracts distribution policy from the CBOR record
func (lm *LiveMetadata) GetDistributionPolicy() (*streamplace.LiveMetadata_DistributionPolicy, error) {
	metadata, err := lm.ToStreamplaceLiveMetadata()
	if err != nil {
		return nil, err
	}
	return metadata.DistributionPolicy, nil
}

// GetRights extracts rights information from the CBOR record
func (lm *LiveMetadata) GetRights() (*streamplace.LiveMetadata_Rights, error) {
	metadata, err := lm.ToStreamplaceLiveMetadata()
	if err != nil {
		return nil, err
	}
	return metadata.Rights, nil
}

// CreateLiveMetadata creates a new live metadata record in the database
func (m *DBModel) CreateLiveMetadata(ctx context.Context, lm *LiveMetadata) error {
	return m.DB.Create(lm).Error
}

// GetLiveMetadata retrieves a live metadata record by CID
func (m *DBModel) GetLiveMetadata(ctx context.Context, cid string) (*LiveMetadata, error) {
	var metadata LiveMetadata
	err := m.DB.
		Preload("Repo").
		Where("cid = ?", cid).
		First(&metadata).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving live metadata: %w", err)
	}
	return &metadata, nil
}

// GetLiveMetadataByLivestreamRef retrieves live metadata by livestream reference
func (m *DBModel) GetLiveMetadataByLivestreamRef(ctx context.Context, livestreamCID string) (*LiveMetadata, error) {
	var metadata LiveMetadata
	err := m.DB.
		Preload("Repo").
		Where("livestream_ref_cid = ?", livestreamCID).
		First(&metadata).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving live metadata by livestream ref: %w", err)
	}
	return &metadata, nil
}

// GetLiveMetadataForRepo retrieves all live metadata records for a repo
func (m *DBModel) GetLiveMetadataForRepo(ctx context.Context, repoDID string) ([]LiveMetadata, error) {
	var metadata []LiveMetadata
	err := m.DB.
		Preload("Repo").
		Where("repo_did = ?", repoDID).
		Order("created_at DESC").
		Find(&metadata).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving live metadata for repo: %w", err)
	}
	return metadata, nil
}

// GetLiveMetadataWithContentWarnings retrieves all metadata records that have content warnings
func (m *DBModel) GetLiveMetadataWithContentWarnings(ctx context.Context) ([]LiveMetadata, error) {
	var metadata []LiveMetadata
	err := m.DB.
		Preload("Repo").
		Where("has_content_warnings = ?", true).
		Order("created_at DESC").
		Find(&metadata).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving metadata with content warnings: %w", err)
	}
	return metadata, nil
}