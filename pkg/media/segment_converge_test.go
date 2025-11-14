package media

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/log"
)

var ConvergeCases = []string{
	"/Users/iameli/testvids/determinism/2025-11-14T21-10-51-750Z-attempt-000.mp4", // good
	"/Users/iameli/testvids/determinism/2025-11-14T21-10-57-754Z-attempt-000.mp4", // evil
}

func TestConvergeSegment(t *testing.T) {
	ctx := log.WithDebugValue(context.Background(), map[string]map[string]int{"func": {"ConcatDemuxBin": 9, "ConcatBin": 9}})
	// /Users/iameli/testvids/determinism/2025-11-14T21-10-57-754Z-attempt-000.mp4
	withNoGSTLeaks(t, func() {
		for _, file := range ConvergeCases {
			t.Log("--------------")
			t.Logf("test case: %s", file)
			bs, err := os.ReadFile(file)
			require.NoError(t, err)
			bs, err = ConvergeSegment(ctx, &config.CLI{}, bs, 0, "test-streamer")
			require.NoError(t, err)
			require.Greater(t, len(bs), 0)
		}
	})
}
