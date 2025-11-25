package statedb

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Recommendation struct {
	UserDID   string          `gorm:"column:user_did;primaryKey"`
	Streamers json.RawMessage `gorm:"column:streamers;type:json;not null"`
	CreatedAt time.Time       `gorm:"column:created_at"`
	UpdatedAt time.Time       `gorm:"column:updated_at"`
}

func (r *Recommendation) TableName() string {
	return "recommendations"
}

// UpsertRecommendation creates or updates recommendations for a user
func (state *StatefulDB) UpsertRecommendation(rec *Recommendation) error {
	if rec.UserDID == "" {
		return fmt.Errorf("user DID cannot be empty")
	}

	// Validate JSON contains array of max 8 DIDs
	var streamers []string
	if err := json.Unmarshal(rec.Streamers, &streamers); err != nil {
		return fmt.Errorf("invalid streamers JSON: %w", err)
	}
	if len(streamers) > 8 {
		return fmt.Errorf("maximum 8 recommendations allowed, got %d", len(streamers))
	}

	now := time.Now()
	if rec.CreatedAt.IsZero() {
		rec.CreatedAt = now
	}
	rec.UpdatedAt = now

	// Use GORM's upsert (On Conflict Do Update)
	result := state.DB.Save(rec)
	if result.Error != nil {
		return fmt.Errorf("database upsert failed: %w", result.Error)
	}

	return nil
}

// GetRecommendation retrieves recommendations for a user
func (state *StatefulDB) GetRecommendation(userDID string) (*Recommendation, error) {
	if userDID == "" {
		return nil, fmt.Errorf("user DID cannot be empty")
	}

	var rec Recommendation
	err := state.DB.Where("user_did = ?", userDID).First(&rec).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, fmt.Errorf("database query failed: %w", err)
	}
	return &rec, nil
}

// DeleteRecommendation removes recommendations for a user
func (state *StatefulDB) DeleteRecommendation(userDID string) error {
	if userDID == "" {
		return fmt.Errorf("user DID cannot be empty")
	}

	result := state.DB.Where("user_did = ?", userDID).Delete(&Recommendation{})
	if result.Error != nil {
		return fmt.Errorf("database delete failed: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("recommendation not found")
	}
	return nil
}

// GetStreamersArray is a helper to unmarshal the streamers JSON into a slice
func (r *Recommendation) GetStreamersArray() ([]string, error) {
	var streamers []string
	if err := json.Unmarshal(r.Streamers, &streamers); err != nil {
		return nil, fmt.Errorf("failed to unmarshal streamers: %w", err)
	}
	return streamers, nil
}
