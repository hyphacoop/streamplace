package webhook

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/bluesky-social/indigo/api/bsky"
	"gorm.io/datatypes"
	"stream.place/streamplace/pkg/integrations/discord"
	"stream.place/streamplace/pkg/integrations/discord/discordtypes"
	"stream.place/streamplace/pkg/streamplace"
)

// WebhookData represents the essential webhook information
type WebhookData struct {
	ID      uint
	URL     string
	Events  datatypes.JSON
	Active  bool
	Prefix  string
	Suffix  string
	Rewrite datatypes.JSON
	Name    string
}

// Manager handles webhook sending
type Manager struct{}

func NewManager() *Manager {
	return &Manager{}
}

// SendChatWebhook sends chat message to a specific webhook
func (m *Manager) SendChatWebhook(ctx context.Context, webhook WebhookData, authorDID string, scm *streamplace.ChatDefs_MessageView) error {
	discordWebhook, err := m.webhookDataToDiscordWebhook(webhook)
	if err != nil {
		return fmt.Errorf("failed to convert webhook data: %w", err)
	}

	return discord.SendChat(ctx, discordWebhook, authorDID, scm)
}

// SendLivestreamWebhook sends livestream notification to a specific webhook
func (m *Manager) SendLivestreamWebhook(ctx context.Context, webhook WebhookData, pdsURL string, lsv *streamplace.Livestream_LivestreamView, postView *bsky.FeedDefs_PostView, spcp *streamplace.ChatProfile) error {
	discordWebhook, err := m.webhookDataToDiscordWebhook(webhook)
	if err != nil {
		return fmt.Errorf("failed to convert webhook data: %w", err)
	}

	return discord.SendLivestream(ctx, discordWebhook, pdsURL, lsv, postView, spcp)
}

// webhookDataToDiscordWebhook converts WebhookData to discordtypes.Webhook
func (m *Manager) webhookDataToDiscordWebhook(webhook WebhookData) (*discordtypes.Webhook, error) {
	var rewriteRules []*discordtypes.WebhookRewrite
	if len(webhook.Rewrite) > 0 {
		err := json.Unmarshal(webhook.Rewrite, &rewriteRules)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal rewrite rules: %w", err)
		}
	}

	return &discordtypes.Webhook{
		URL:     webhook.URL,
		Prefix:  webhook.Prefix,
		Suffix:  webhook.Suffix,
		Rewrite: rewriteRules,
	}, nil
}

// WebhookToWebhookData converts a statedb.Webhook to WebhookData to avoid import cycle
func WebhookToWebhookData(id uint, url string, events datatypes.JSON, active bool, prefix, suffix string, rewrite datatypes.JSON, name string) WebhookData {
	return WebhookData{
		ID:      id,
		URL:     url,
		Events:  events,
		Active:  active,
		Prefix:  prefix,
		Suffix:  suffix,
		Rewrite: rewrite,
		Name:    name,
	}
}
