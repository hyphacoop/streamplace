package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
)

// https://docs.expo.dev/linking/ios-universal-links/
func (a *StreamplaceAPI) HandleAppleAppSiteAssociation(ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if a.CLI.AppleTeamID == "" || a.CLI.AppBundleID == "" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		data := map[string]any{
			"applinks": map[string]any{
				"apps": []string{},
				"details": []map[string]any{
					{
						"appID": a.CLI.AppleTeamID + "." + a.CLI.AppBundleID,
						"paths": []string{"*", "NOT /docs/*", "NOT /api/*", "NOT /xrpc/*", "NOT /oauth/*"},
					},
				},
			},
			"activitycontinuation": map[string]any{
				"apps": []string{a.CLI.AppleTeamID + "." + a.CLI.AppBundleID},
			},
			"webcredentials": map[string]any{
				"apps": []string{a.CLI.AppleTeamID + "." + a.CLI.AppBundleID},
			},
		}
		err := json.NewEncoder(w).Encode(data)
		if err != nil {
			log.Printf("error encoding apple app site association: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}

// https://docs.expo.dev/linking/android-app-links/
func (a *StreamplaceAPI) HandleAndroidAssetLinks(ctx context.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if a.CLI.AndroidCertFingerprint == "" || a.CLI.AppBundleID == "" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		data := []map[string]any{
			{
				"relation": []string{"delegate_permission/common.handle_all_urls"},
				"target": map[string]any{
					"namespace":    "android_app",
					"package_name": a.CLI.AppBundleID,
					"sha256_cert_fingerprints": []string{
						a.CLI.AndroidCertFingerprint,
					},
				},
			},
		}
		err := json.NewEncoder(w).Encode(data)
		if err != nil {
			log.Printf("error encoding android asset links: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}
