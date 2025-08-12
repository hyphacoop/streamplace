package statedb

import (
	"errors"

	"github.com/streamplace/oatproxy/pkg/oatproxy"
	"gorm.io/gorm"
)

func (db *StatefulDB) CreateOAuthSession(id string, session *oatproxy.OAuthSession) error {
	return db.DB.Create(session).Error
}

func (db *StatefulDB) LoadOAuthSession(id string) (*oatproxy.OAuthSession, error) {
	var session oatproxy.OAuthSession
	if err := db.DB.Where("downstream_dpop_jkt = ?", id).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &session, nil
}

func (db *StatefulDB) UpdateOAuthSession(id string, session *oatproxy.OAuthSession) error {
	res := db.DB.Model(&oatproxy.OAuthSession{}).Where("downstream_dpop_jkt = ?", id).Updates(session)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("no rows affected")
	}
	return nil
}

func (db *StatefulDB) ListOAuthSessions() ([]oatproxy.OAuthSession, error) {
	var sessions []oatproxy.OAuthSession
	if err := db.DB.Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (db *StatefulDB) GetSessionByDID(did string) (*oatproxy.OAuthSession, error) {
	var session oatproxy.OAuthSession
	if err := db.DB.Where("repo_did = ? AND revoked_at IS NULL", did).Order("updated_at DESC").First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}
