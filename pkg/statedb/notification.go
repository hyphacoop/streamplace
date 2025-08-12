package statedb

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Notification struct {
	Token     string `gorm:"primarykey"`
	RepoDID   string `json:"repoDID,omitempty" gorm:"column:repo_did;index"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (db *StatefulDB) CreateNotification(token string, repoDID string) error {
	not := Notification{
		Token: token,
	}
	if repoDID != "" {
		not.RepoDID = repoDID
	}
	err := db.DB.Save(&not).Error
	if err != nil {
		return err
	}
	return nil
}

func (db *StatefulDB) ListNotifications() ([]Notification, error) {
	nots := []Notification{}
	err := db.DB.Find(&nots).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving notifications: %w", err)
	}
	return nots, nil
}

func (db *StatefulDB) ListUserNotifications(userDID string) ([]Notification, error) {
	nots := []Notification{}
	err := db.DB.Where("repo_did = ?", userDID).Find(&nots).Error
	if err != nil {
		return nil, fmt.Errorf("error retrieving notifications: %w", err)
	}
	return nots, nil
}

// todo fixme we don't have followers in this database
func (db *StatefulDB) GetFollowersNotificationTokens(userDID string) ([]string, error) {
	var tokens []string

	err := db.DB.Model(&Notification{}).
		Distinct("notifications.token").
		Joins("JOIN follows ON follows.user_did = notifications.repo_did").
		Where("follows.subject_did = ?", userDID).
		Pluck("notifications.token", &tokens).
		Error

	if err != nil {
		return nil, fmt.Errorf("error retrieving follower notification tokens: %w", err)
	}

	// also you prolly wanna get one for yourself
	nots, err := db.ListUserNotifications(userDID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user notifications: %w", err)
	}
	for _, not := range nots {
		tokens = append(tokens, not.Token)
	}

	return tokens, nil
}
