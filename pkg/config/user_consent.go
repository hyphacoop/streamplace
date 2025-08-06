package config

import (
	"encoding/json"

	"gopkg.in/yaml.v3"
)

type UserConsentData struct {
	ContentWarnings []string `yaml:"content_warnings" json:"content_warnings"`
}

// ParseUserConsentFromYAML parses YAML content into UserConsentData
func ParseUserConsentFromYAML(data []byte) (*UserConsentData, error) {
	var consent UserConsentData
	err := yaml.Unmarshal(data, &consent)
	if err != nil {
		return nil, err
	}
	return &consent, nil
}

// ParseUserConsentFromJSON parses JSON content into UserConsentData
func ParseUserConsentFromJSON(data []byte) (*UserConsentData, error) {
	var consent UserConsentData
	err := json.Unmarshal(data, &consent)
	if err != nil {
		return nil, err
	}
	return &consent, nil
} 