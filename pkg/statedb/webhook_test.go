package statedb

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestWebhook(t *testing.T) {
	WithAllDatabases(t, func(state *StatefulDB) {
		webhook := &Webhook{
			UserDID: "did:web:example.com",
			URL:     "https://example.com",
			Events:  []byte(`["test"]`),
		}
		err := state.CreateWebhook(webhook)
		require.NoError(t, err)
		activeWebhooks, err := state.GetActiveWebhooksForUser("did:web:example.com", "test")
		require.NoError(t, err)
		require.Len(t, activeWebhooks, 1)
		require.Equal(t, webhook.URL, activeWebhooks[0].URL)
		require.Equal(t, webhook.Events, activeWebhooks[0].Events)
	})
}
