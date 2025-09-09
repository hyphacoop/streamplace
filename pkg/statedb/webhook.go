package statedb

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/datatypes"
	"stream.place/streamplace/pkg/streamplace"
)

type Webhook struct {
	// UUID primary key
	ID      string `gorm:"column:id;primarykey"`
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
func (state *StatefulDB) GetWebhook(id string, userDID string) (*Webhook, error) {
	var webhook Webhook
	err := state.DB.Where("id = ? AND user_did = ?", id, userDID).First(&webhook).Error
	// if record doesn't exist, return nil, nil
	if err != nil {
		if err.Error() == "record not found" {
			return nil, nil
		}
		return nil, err
	}
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
func (state *StatefulDB) UpdateWebhook(id string, userDID string, updates map[string]interface{}) (*Webhook, error) {
	updates["updated_at"] = time.Now()
	err := state.DB.Model(&Webhook{}).Where("id = ? AND user_did = ?", id, userDID).Updates(updates).Error
	if err != nil {
		return nil, err
	}
	return state.GetWebhook(id, userDID)
}

// DeleteWebhook deletes a webhook by ID and user DID
func (state *StatefulDB) DeleteWebhook(id string, userDID string) error {
	return state.DB.Where("id = ? AND user_did = ?", id, userDID).Delete(&Webhook{}).Error
}

// GetActiveWebhooksForUser retrieves active webhooks for a user filtered by event type
func (state *StatefulDB) GetActiveWebhooksForUser(userDID string, eventType string) ([]Webhook, error) {
	var webhooks []Webhook
	var err error
	if state.Type == DBTypePostgres {
		err = state.DB.Where("user_did = ? AND active = ? AND events @> ?",
			userDID, true, fmt.Sprintf(`["%s"]`, eventType)).Find(&webhooks).Error
	} else {
		err = state.DB.Where("user_did = ? AND active = ? AND JSON_EXTRACT(events, '$') LIKE ?",
			userDID, true, fmt.Sprintf(`["%s"]`, eventType)).Find(&webhooks).Error
	}
	return webhooks, err
}

// IncrementWebhookError increments the error count for a webhook
func (state *StatefulDB) IncrementWebhookError(id string) error {
	return state.DB.Model(&Webhook{}).Where("id = ?", id).UpdateColumn("error_count", state.DB.Raw("error_count + 1")).Error
}

// ResetWebhookError resets the error count for a webhook
func (state *StatefulDB) ResetWebhookError(id string) error {
	return state.DB.Model(&Webhook{}).Where("id = ?", id).Updates(map[string]interface{}{
		"error_count":    0,
		"last_triggered": time.Now(),
	}).Error
}

// ToLexicon converts a database Webhook to a streamplace.ServerDefs_Webhook
func (w *Webhook) ToLexicon() (*streamplace.ServerDefs_Webhook, error) {
	var events []string
	if len(w.Events) > 0 {
		err := json.Unmarshal(w.Events, &events)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal events: %w", err)
		}
	}

	var rewriteRules []*streamplace.ServerDefs_RewriteRule
	if len(w.Rewrite) > 0 {
		var dbRules []map[string]string
		err := json.Unmarshal(w.Rewrite, &dbRules)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal rewrite rules: %w", err)
		}
		for _, rule := range dbRules {
			rewriteRules = append(rewriteRules, &streamplace.ServerDefs_RewriteRule{
				From: rule["from"],
				To:   rule["to"],
			})
		}
	}

	createdAt := w.CreatedAt.Format(time.RFC3339)

	webhook := &streamplace.ServerDefs_Webhook{
		Id:        w.ID,
		Url:       w.URL,
		Events:    events,
		Active:    w.Active,
		CreatedAt: createdAt,
		Rewrite:   rewriteRules,
	}

	if w.Prefix != "" {
		webhook.Prefix = &w.Prefix
	}
	if w.Suffix != "" {
		webhook.Suffix = &w.Suffix
	}
	if w.Name != "" {
		webhook.Name = &w.Name
	}
	if w.Description != "" {
		webhook.Description = &w.Description
	}
	if !w.UpdatedAt.IsZero() {
		updatedAt := w.UpdatedAt.Format(time.RFC3339)
		webhook.UpdatedAt = &updatedAt
	}
	if w.LastTriggered != nil {
		lastTriggered := w.LastTriggered.Format(time.RFC3339)
		webhook.LastTriggered = &lastTriggered
	}
	if w.ErrorCount > 0 {
		errorCount := int64(w.ErrorCount)
		webhook.ErrorCount = &errorCount
	}

	return webhook, nil
}

// FromLexiconInput converts a streamplace.ServerCreateWebhook_Input to a database Webhook
func WebhookFromLexiconInput(input *streamplace.ServerCreateWebhook_Input, userDID, id string) (*Webhook, error) {
	eventsJSON, err := json.Marshal(input.Events)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal events: %w", err)
	}

	var rewriteJSON datatypes.JSON
	if len(input.Rewrite) > 0 {
		dbRules := make([]map[string]string, len(input.Rewrite))
		for i, rule := range input.Rewrite {
			dbRules[i] = map[string]string{
				"from": rule.From,
				"to":   rule.To,
			}
		}
		rewriteJSON, err = json.Marshal(dbRules)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal rewrite rules: %w", err)
		}
	}

	webhook := &Webhook{
		ID:        id,
		UserDID:   userDID,
		URL:       input.Url,
		Events:    eventsJSON,
		Active:    input.Active != nil && *input.Active,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Rewrite:   rewriteJSON,
	}

	if input.Prefix != nil {
		webhook.Prefix = *input.Prefix
	}
	if input.Suffix != nil {
		webhook.Suffix = *input.Suffix
	}
	if input.Name != nil {
		webhook.Name = *input.Name
	}
	if input.Description != nil {
		webhook.Description = *input.Description
	}

	return webhook, nil
}
