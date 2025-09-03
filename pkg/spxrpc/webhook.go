package spxrpc

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/streamplace/oatproxy/pkg/oatproxy"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/statedb"
	placestreamtypes "stream.place/streamplace/pkg/streamplace"
)

func (s *Server) handlePlaceStreamServerCreateWebhook(ctx context.Context, input *placestreamtypes.ServerCreateWebhook_Input) (*placestreamtypes.ServerCreateWebhook_Output, error) {
	// Get authenticated user
	session, _ := oatproxy.GetOAuthSession(ctx)
	if session == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "oauth session not found")
	}

	// Validate input
	if input.Url == "" {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "URL is required")
	}
	if len(input.Events) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "At least one event type is required")
	}

	// Validate URL format
	if _, err := url.Parse(input.Url); err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid URL format")
	}

	// Check for duplicate URL for this user
	existing, err := s.statefulDB.ListWebhooks(session.DID, 1, 0, map[string]interface{}{
		"url": input.Url,
	})
	if err != nil {
		log.Error(ctx, "failed to check for duplicate webhook", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to validate webhook")
	}
	if len(existing) > 0 {
		return nil, echo.NewHTTPError(http.StatusConflict, "A webhook with this URL already exists")
	}

	// Convert input to database model
	eventsJSON, _ := json.Marshal(input.Events)
	rewriteJSON, _ := json.Marshal(input.Rewrite)

	webhook := &statedb.Webhook{
		UserDID:     session.DID,
		URL:         input.Url,
		Events:      eventsJSON,
		Active:      input.Active != nil && *input.Active,
		Prefix:      getStringValue(input.Prefix),
		Suffix:      getStringValue(input.Suffix),
		Rewrite:     rewriteJSON,
		Name:        getStringValue(input.Name),
		Description: getStringValue(input.Description),
	}

	// Create webhook
	err = s.statefulDB.CreateWebhook(webhook)
	if err != nil {
		log.Error(ctx, "failed to create webhook", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to create webhook")
	}

	// Convert to API response
	apiWebhook, err := dbWebhookToAPI(webhook)
	if err != nil {
		log.Error(ctx, "failed to convert webhook to API format", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to format webhook response")
	}

	return &placestreamtypes.ServerCreateWebhook_Output{
		Webhook: apiWebhook,
	}, nil
}

func (s *Server) handlePlaceStreamServerListWebhooks(ctx context.Context, active *bool, cursor string, event string, limit int) (*placestreamtypes.ServerListWebhooks_Output, error) {
	// Get authenticated user
	session, _ := oatproxy.GetOAuthSession(ctx)
	if session == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "oauth session not found")
	}

	// Set default limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	// Parse cursor for offset
	offset := 0
	if cursor != "" {
		var err error
		offset, err = strconv.Atoi(cursor)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid cursor")
		}
	}

	// Build filters
	filters := make(map[string]interface{})
	if active != nil {
		filters["active"] = *active
	}

	// Get webhooks
	webhooks, err := s.statefulDB.ListWebhooks(session.DID, limit+1, offset, filters)
	if err != nil {
		log.Error(ctx, "failed to list webhooks", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to list webhooks")
	}

	// Filter by event type if specified
	if event != "" {
		filtered := make([]statedb.Webhook, 0)
		for _, w := range webhooks {
			var events []string
			if err := json.Unmarshal(w.Events, &events); err == nil {
				for _, e := range events {
					if e == event {
						filtered = append(filtered, w)
						break
					}
				}
			}
		}
		webhooks = filtered
	}

	// Check if there are more results
	var nextCursor *string
	if len(webhooks) > limit {
		webhooks = webhooks[:limit]
		next := strconv.Itoa(offset + limit)
		nextCursor = &next
	}

	// Convert to API format
	apiWebhooks := make([]*placestreamtypes.ServerDefs_Webhook, len(webhooks))
	for i, webhook := range webhooks {
		apiWebhook, err := dbWebhookToAPI(&webhook)
		if err != nil {
			log.Error(ctx, "failed to convert webhook to API format", "err", err)
			continue
		}
		apiWebhooks[i] = apiWebhook
	}

	return &placestreamtypes.ServerListWebhooks_Output{
		Webhooks: apiWebhooks,
		Cursor:   nextCursor,
	}, nil
}

func (s *Server) handlePlaceStreamServerGetWebhook(ctx context.Context, id string) (*placestreamtypes.ServerGetWebhook_Output, error) {
	// Get authenticated user
	session, _ := oatproxy.GetOAuthSession(ctx)
	if session == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "oauth session not found")
	}

	// Parse webhook ID
	webhookID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid webhook ID")
	}

	// Get webhook
	webhook, err := s.statefulDB.GetWebhook(uint(webhookID), session.DID)
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			return nil, echo.NewHTTPError(http.StatusNotFound, "Webhook not found")
		}
		log.Error(ctx, "failed to get webhook", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to get webhook")
	}

	// Convert to API format
	apiWebhook, err := dbWebhookToAPI(webhook)
	if err != nil {
		log.Error(ctx, "failed to convert webhook to API format", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to format webhook response")
	}

	return &placestreamtypes.ServerGetWebhook_Output{
		Webhook: apiWebhook,
	}, nil
}

func (s *Server) handlePlaceStreamServerUpdateWebhook(ctx context.Context, input *placestreamtypes.ServerUpdateWebhook_Input) (*placestreamtypes.ServerUpdateWebhook_Output, error) {
	// Get authenticated user
	session, _ := oatproxy.GetOAuthSession(ctx)
	if session == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "oauth session not found")
	}

	// Parse webhook ID
	webhookID, err := strconv.ParseUint(input.Id, 10, 32)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid webhook ID")
	}

	// Validate URL if provided
	if input.Url != nil {
		if _, err := url.Parse(*input.Url); err != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid URL format")
		}
	}

	// Build updates map
	updates := make(map[string]interface{})
	if input.Url != nil {
		updates["url"] = *input.Url
	}
	if input.Events != nil {
		eventsJSON, _ := json.Marshal(input.Events)
		updates["events"] = eventsJSON
	}
	if input.Active != nil {
		updates["active"] = *input.Active
	}
	if input.Prefix != nil {
		updates["prefix"] = *input.Prefix
	}
	if input.Suffix != nil {
		updates["suffix"] = *input.Suffix
	}
	if input.Rewrite != nil {
		rewriteJSON, _ := json.Marshal(input.Rewrite)
		updates["rewrite"] = rewriteJSON
	}
	if input.Name != nil {
		updates["name"] = *input.Name
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}

	if len(updates) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "No fields to update")
	}

	// Update webhook
	webhook, err := s.statefulDB.UpdateWebhook(uint(webhookID), session.DID, updates)
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			return nil, echo.NewHTTPError(http.StatusNotFound, "Webhook not found")
		}
		log.Error(ctx, "failed to update webhook", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to update webhook")
	}

	// Convert to API format
	apiWebhook, err := dbWebhookToAPI(webhook)
	if err != nil {
		log.Error(ctx, "failed to convert webhook to API format", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to format webhook response")
	}

	return &placestreamtypes.ServerUpdateWebhook_Output{
		Webhook: apiWebhook,
	}, nil
}

func (s *Server) handlePlaceStreamServerDeleteWebhook(ctx context.Context, input *placestreamtypes.ServerDeleteWebhook_Input) (*placestreamtypes.ServerDeleteWebhook_Output, error) {
	// Get authenticated user
	session, _ := oatproxy.GetOAuthSession(ctx)
	if session == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "oauth session not found")
	}

	// Parse webhook ID
	webhookID, err := strconv.ParseUint(input.Id, 10, 32)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid webhook ID")
	}

	// Delete webhook
	err = s.statefulDB.DeleteWebhook(uint(webhookID), session.DID)
	if err != nil {
		log.Error(ctx, "failed to delete webhook", "err", err)
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete webhook")
	}

	return &placestreamtypes.ServerDeleteWebhook_Output{
		Success: true,
	}, nil
}

// Helper functions

func getStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func dbWebhookToAPI(webhook *statedb.Webhook) (*placestreamtypes.ServerDefs_Webhook, error) {
	var events []string
	if len(webhook.Events) > 0 {
		if err := json.Unmarshal(webhook.Events, &events); err != nil {
			return nil, fmt.Errorf("failed to unmarshal events: %w", err)
		}
	}

	var rewrite []*placestreamtypes.ServerDefs_RewriteRule
	if len(webhook.Rewrite) > 0 {
		if err := json.Unmarshal(webhook.Rewrite, &rewrite); err != nil {
			return nil, fmt.Errorf("failed to unmarshal rewrite rules: %w", err)
		}
	}

	result := &placestreamtypes.ServerDefs_Webhook{
		Id:         fmt.Sprintf("%d", webhook.ID),
		Url:        webhook.URL,
		Events:     events,
		Active:     webhook.Active,
		CreatedAt:  webhook.CreatedAt.Format(time.RFC3339),
		ErrorCount: func() *int64 { v := int64(webhook.ErrorCount); return &v }(),
	}

	if webhook.Prefix != "" {
		result.Prefix = &webhook.Prefix
	}
	if webhook.Suffix != "" {
		result.Suffix = &webhook.Suffix
	}
	if len(rewrite) > 0 {
		result.Rewrite = rewrite
	}
	if webhook.Name != "" {
		result.Name = &webhook.Name
	}
	if webhook.Description != "" {
		result.Description = &webhook.Description
	}
	if webhook.LastTriggered != nil {
		lastTriggered := webhook.LastTriggered.Format(time.RFC3339)
		result.LastTriggered = &lastTriggered
	}
	if !webhook.UpdatedAt.IsZero() {
		updatedAt := webhook.UpdatedAt.Format(time.RFC3339)
		result.UpdatedAt = &updatedAt
	}

	return result, nil
}
