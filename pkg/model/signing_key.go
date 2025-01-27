package model

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type SigningKey struct {
	DID       string    `gorm:"primaryKey;column:did" json:"did"`
	RepoDID   string    `gorm:"primaryKey;column:repo_did" json:"repoDID"`
	Repo      *Repo     `json:"repo,omitempty" gorm:"foreignKey:RepoDID;references:DID"`
	CreatedAt time.Time `json:"createdAt"`
	RevokedAt time.Time `json:"revokedAt"`
}

func (SigningKey) TableName() string {
	return "signing_keys"
}

func (m *DBModel) UpdateSigningKey(key *SigningKey) error {
	return m.DB.Save(key).Error
}

func (m *DBModel) GetSigningKey(did, repoDID string) (*SigningKey, error) {
	var key SigningKey
	res := m.DB.Model(SigningKey{}).Where("did = ?", did).Where("repo_did = ?", repoDID).First(&key)
	if errors.Is(res.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if res.Error != nil {
		return nil, res.Error
	}
	return &key, nil
}

func (m *DBModel) GetSigningKeysForRepo(repoDID string) ([]SigningKey, error) {
	var keys []SigningKey
	res := m.DB.Model(SigningKey{}).Where("repo_did = ?", repoDID).Find(&keys)
	if res.Error != nil {
		return nil, res.Error
	}
	return keys, nil
}
