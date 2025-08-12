package statedb

import (
	"fmt"
	"time"
)

type Notification struct {
	Token     string    `gorm:"column:token;primarykey"`
	RepoDID   string    `json:"repoDID,omitempty" gorm:"column:repo_did;index"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (state *StatefulDB) CreateNotification(token string, repoDID string) error {
	not := Notification{
		Token: token,
	}
	if repoDID != "" {
		not.RepoDID = repoDID
	}
	err := state.DB.Save(&not).Error
	if err != nil {
		return err
	}
	return nil
}

func (state *StatefulDB) ListNotifications() ([]Notification, error) {
	nots := []Notification{}
	err := state.DB.Find(&nots).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving notifications: %w", err)
	}
	return nots, nil
}

func (state *StatefulDB) ListUserNotifications(userDID string) ([]Notification, error) {
	nots := []Notification{}
	err := state.DB.Where("repo_did = ?", userDID).Find(&nots).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving notifications: %w", err)
	}
	return nots, nil
}

// todo fixme we don't have followers in this database
func (state *StatefulDB) GetFollowersNotificationTokens(userDID string) ([]string, error) {
	var tokens []string

	err := state.DB.Model(&Notification{}).
		Distinct("notifications.token").
		Joins("JOIN follows ON follows.user_did = notifications.repo_did").
		Where("follows.subject_did = ?", userDID).
		Pluck("notifications.token", &tokens).
		Error

	if err != nil {
		return nil, fmt.Errorf("error retrieving follower notification tokens: %w", err)
	}

	// also you prolly wanna get one for yourself
	nots, err := state.ListUserNotifications(userDID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user notifications: %w", err)
	}
	for _, not := range nots {
		tokens = append(tokens, not.Token)
	}

	return tokens, nil
}
