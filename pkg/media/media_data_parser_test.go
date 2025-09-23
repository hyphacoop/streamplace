package media

import (
	"context"
	"io"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/test/remote"
)

func TestMediaDataParser(t *testing.T) {
	segmentsWithoutBFrames := []string{
		remote.RemoteFixture("d63d26050db9a60c0944b4c2e2b1d052c4350a2a8a877324c7b0b7e7a0c1ae27/bframe-false-positive.mp4"),
		getFixture("sample-segment.mp4"),
	}
	withNoGSTLeaks(t, func() {
		for _, segment := range segmentsWithoutBFrames {
			// Open input file
			inputFile, err := os.Open(segment)
			require.NoError(t, err)
			defer inputFile.Close()
			bs, err := io.ReadAll(inputFile)
			require.NoError(t, err)

			ctx := log.WithDebugValue(context.Background(), map[string]map[string]int{"GStreamerFunc": {"ParseSegmentMediaData": 9}})
			mediaData, err := ParseSegmentMediaData(ctx, bs)
			require.NoError(t, err)
			require.NotNil(t, mediaData)
			require.False(t, mediaData.Video[0].BFrames, "Video should not have BFrames")
			require.Greater(t, mediaData.Duration, int64(0), "Video duration should not be empty")
		}
	})
}

func TestMediaDataParserBFrames(t *testing.T) {
	withNoGSTLeaks(t, func() {
		inputFile, err := os.Open(remote.RemoteFixture("5ea6c4491bade0cdcad3770aa0b63b2cd7a580e233ee320d5bc2282503b26491/segment-with-bframes.mp4"))
		require.NoError(t, err)
		defer inputFile.Close()
		bs, err := io.ReadAll(inputFile)
		require.NoError(t, err)

		ctx := log.WithDebugValue(context.Background(), map[string]map[string]int{"GStreamerFunc": {"ParseSegmentMediaData": 9}})
		mediaData, err := ParseSegmentMediaData(ctx, bs)
		require.NoError(t, err)
		require.NotNil(t, mediaData)
		require.True(t, mediaData.Video[0].BFrames, "Video should have BFrames")
		require.Greater(t, mediaData.Duration, int64(0), "Video duration should not be empty")
	})
}
