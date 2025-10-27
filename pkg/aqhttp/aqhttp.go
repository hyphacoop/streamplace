package aqhttp

import (
	"context"
	"net/http"
	"time"
)

var UserAgent string = "streamplace/unknown"

// Client is the default HTTP client with SSRF protection.
// Uses DNS-over-HTTPS to validate destination IPs and blocks private/bogon ranges.
// For trusted infrastructure endpoints, use TrustedClient instead.
var Client http.Client

// TrustedClient is an HTTP client without SSRF protection.
// Use this only for trusted infrastructure endpoints (e.g., livepeer.com)
// where the validation overhead is problematic.
var TrustedClient http.Client

func init() {
	Client = http.Client{
		Transport: NewUntrustedTransport(),
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Timeout: 30 * time.Second,
	}

	TrustedClient = http.Client{
		Transport: NewTrustedTransport(),
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Timeout: 30 * time.Second,
	}
}

// Do executes an HTTP request with SSRF protection (secure by default).
// Most callsites should use this function.
func Do(ctx context.Context, req *http.Request) (*http.Response, error) {
	return Client.Do(req.WithContext(ctx))
}

// DoTrusted executes an HTTP request without SSRF protection.
// Use this only for trusted infrastructure endpoints.
func DoTrusted(ctx context.Context, req *http.Request) (*http.Response, error) {
	return TrustedClient.Do(req.WithContext(ctx))
}
