package model

import (
	"context"
	"errors"
	"fmt"

	lexutil "github.com/bluesky-social/indigo/lex/util"
	"gorm.io/gorm"
	"stream.place/streamplace/pkg/streamplace"
)

type DefaultMetadata struct {
	RepoDID string `json:"repoDID"        gorm:"primarykey;column:repo_did"`
	Repo    *Repo  `json:"repo,omitempty" gorm:"foreignKey:DID;references:RepoDID"`
	Record  *[]byte
}

func (m *DefaultMetadata) ToStreamplaceDefaultMetadata() (*streamplace.DefaultMetadata, error) {
	rec, err := lexutil.CborDecodeValue(*m.Record)
	if err != nil {
		return nil, fmt.Errorf("error decoding feed post: %w", err)
	}
	sdm, ok := rec.(*streamplace.DefaultMetadata)
	if !ok {
		return nil, fmt.Errorf("invalid default metadata")
	}
	return sdm, nil
}

func (m *DBModel) CreateDefaultMetadata(ctx context.Context, metadata *DefaultMetadata) error {
	err := m.DB.Save(metadata).Error
	if err != nil {
		return err
	}
	return nil
}

func (m *DBModel) GetDefaultMetadata(ctx context.Context, repoDID string) (*DefaultMetadata, error) {
	var metadata DefaultMetadata
	err := m.DB.Where("repo_did = ?", repoDID).First(&metadata).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &metadata, nil
}

func (m *DBModel) DeleteDefaultMetadata(ctx context.Context, repoDID string) error {
	err := m.DB.Where("repo_did = ?", repoDID).Delete(&DefaultMetadata{}).Error
	if err != nil {
		return err
	}
	return nil
}