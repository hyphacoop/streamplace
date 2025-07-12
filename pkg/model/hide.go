package model

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"stream.place/streamplace/pkg/streamplace"
)

type Hide struct {
	RKey          string    `gorm:"primaryKey;column:rkey"`
	CID           string    `gorm:"column:cid"`
	RepoDID       string    `json:"repoDID"              gorm:"column:repo_did"`
	Repo          *Repo     `json:"repo,omitempty"       gorm:"foreignKey:DID;references:RepoDID"`
	HiddenMessage string    `gorm:"column:hidden_message" json:"hiddenMessage"`
	CreatedAt     time.Time `gorm:"column:created_at"`
}

func (h *Hide) ToStreamplaceHide() (*streamplace.ChatHide, error) {
	return &streamplace.ChatHide{
		LexiconTypeID: "place.stream.chat.hide",
		HiddenMessage: h.HiddenMessage,
	}, nil
}

func (m *DBModel) CreateHide(ctx context.Context, hide *Hide) error {
	return m.DB.Create(hide).Error
}

func (m *DBModel) GetHide(ctx context.Context, rkey string) (*Hide, error) {
	var hide Hide
	err := m.DB.Preload("Repo").Where("rkey = ?", rkey).First(&hide).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &hide, nil
}

func (m *DBModel) DeleteHide(ctx context.Context, rkey string) error {
	return m.DB.Where("rkey = ?", rkey).Delete(&Hide{}).Error
}

func (m *DBModel) GetUserHides(ctx context.Context, userDID string) ([]*Hide, error) {
	var hides []*Hide
	err := m.DB.Where("repo_did = ?", userDID).Find(&hides).Error
	if err != nil {
		return nil, err
	}
	return hides, nil
}
