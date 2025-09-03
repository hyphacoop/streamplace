package statedb

import (
	"time"

	"gorm.io/datatypes"
)

type Webhook struct {
	ID      uint   `gorm:"column:id;primarykey"`
	UserDID string `gorm:"column:user_did;not null;index"`
	URL     string `gorm:"column:url;not null"`

	Events        datatypes.JSON `gorm:"column:events;type:jsonb"`
	Active        bool           `gorm:"column:active;default:true"`
	Prefix        string         `gorm:"column:prefix"`
	Suffix        string         `gorm:"column:suffix"`
	Rewrite       datatypes.JSON `gorm:"column:rewrite;type:jsonb"`
	Name          string         `gorm:"column:name"`
	Description   string         `gorm:"column:description"`
	CreatedAt     time.Time      `gorm:"column:created_at"`
	UpdatedAt     time.Time      `gorm:"column:updated_at"`
	LastTriggered *time.Time     `gorm:"column:last_triggered"`
	ErrorCount    int            `gorm:"column:error_count;default:0"`
}

func (w *Webhook) TableName() string {
	return "webhooks"
}

// CreateWebhook creates a new webhook for a user
func (state *StatefulDB) CreateWebhook(webhook *Webhook) error {
	return state.DB.Create(webhook).Error
}

// GetWebhook retrieves a webhook by ID and user DID
func (state *StatefulDB) GetWebhook(id uint, userDID string) (*Webhook, error) {
	var webhook Webhook
	err := state.DB.Where("id = ? AND user_did = ?", id, userDID).First(&webhook).Error
	return &webhook, err
}

// ListWebhooks retrieves webhooks for a user with optional filters
func (state *StatefulDB) ListWebhooks(userDID string, limit int, offset int, filters map[string]any) ([]Webhook, error) {
	var webhooks []Webhook
	query := state.DB.Where("user_did = ?", userDID)

	// Apply filters
	for key, value := range filters {
		if value != nil {
			query = query.Where(key+" = ?", value)
		}
	}

	err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&webhooks).Error
	return webhooks, err
}

// UpdateWebhook updates an existing webhook
func (state *StatefulDB) UpdateWebhook(id uint, userDID string, updates map[string]interface{}) (*Webhook, error) {
	updates["updated_at"] = time.Now()
	err := state.DB.Model(&Webhook{}).Where("id = ? AND user_did = ?", id, userDID).Updates(updates).Error
	if err != nil {
		return nil, err
	}
	return state.GetWebhook(id, userDID)
}

// DeleteWebhook deletes a webhook by ID and user DID
func (state *StatefulDB) DeleteWebhook(id uint, userDID string) error {
	return state.DB.Where("id = ? AND user_did = ?", id, userDID).Delete(&Webhook{}).Error
}

// GetActiveWebhooksForUser retrieves active webhooks for a user filtered by event type
func (state *StatefulDB) GetActiveWebhooksForUser(userDID string, eventType string) ([]Webhook, error) {
	var webhooks []Webhook
	err := state.DB.Where("user_did = ? AND active = ? AND JSON_EXTRACT(events, '$') LIKE ?",
		userDID, true, "%\""+eventType+"\"%").Find(&webhooks).Error
	return webhooks, err
}

// IncrementWebhookError increments the error count for a webhook
func (state *StatefulDB) IncrementWebhookError(id uint) error {
	return state.DB.Model(&Webhook{}).Where("id = ?", id).UpdateColumn("error_count", state.DB.Raw("error_count + 1")).Error
}

// ResetWebhookError resets the error count for a webhook
func (state *StatefulDB) ResetWebhookError(id uint) error {
	return state.DB.Model(&Webhook{}).Where("id = ?", id).Updates(map[string]interface{}{
		"error_count":    0,
		"last_triggered": time.Now(),
	}).Error
}
