package media

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/log"
)

type ConvergeCase struct {
	Name string
	File string
}

var ConvergeCases = []ConvergeCase{
	{
		Name: "Good",
		File: "/Users/iameli/testvids/determinism/2025-11-14T21-10-51-750Z-attempt-000.mp4",
	},
	{
		Name: "Evil",
		File: "/Users/iameli/testvids/determinism/2025-11-14T21-10-57-754Z-attempt-000.mp4",
	},
	{
		Name: "Stuck",
		File: "/Users/iameli/testvids/stuck-converge/2025-11-17T00-06-43-011Z-converge-segment-did-key-zQ3shfWQC2f6ZT2HV8GgF2tPqXnJy782WEpEDb4BGeaFWcT17.mp4",
	},
}

func TestConvergeSegment(t *testing.T) {
	ctx := log.WithDebugValue(context.Background(), map[string]map[string]int{"func": {"ConcatDemuxBin": 9, "ConcatBin": 9}})
	for _, tc := range ConvergeCases {
		tc := tc // capture for parallel tests if ever used
		t.Run(tc.Name, func(t *testing.T) {
			withNoGSTLeaks(t, func() {
				t.Log("--------------")
				t.Logf("test case: %s", tc.File)
				bs, err := os.ReadFile(tc.File)
				require.NoError(t, err)
				bs, err = ConvergeSegment(ctx, &config.CLI{}, bs, 0, "test-streamer")
				require.NoError(t, err)
				require.Greater(t, len(bs), 0)
			})
		})
	}
}
