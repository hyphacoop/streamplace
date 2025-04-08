package media

import (
	"bytes"
	"context"
	"os"
	"testing"

	"github.com/go-gst/go-gst/gst"
	"github.com/stretchr/testify/require"
)

func TestMP4ToMPEGTS(t *testing.T) {
	gst.Init(nil)

	// Open input file
	inputFile, err := os.Open(getFixture("sample-segment.mp4"))
	require.NoError(t, err)
	defer inputFile.Close()

	// Create a buffer for output
	buf := bytes.Buffer{}

	// Convert MP4 to MPEG-TS
	dur, err := MP4ToMPEGTS(context.Background(), inputFile, &buf)
	require.NoError(t, err)
	require.Greater(t, dur, int64(0), "Duration should be greater than 0")

	// Verify buffer has content
	require.Greater(t, buf.Len(), 0, "Output buffer should not be empty")
}

func TestMPEGTSToMP4(t *testing.T) {
	gst.Init(nil)

	// Open input file
	inputFile, err := os.Open(getFixture("sample-segment.mpegts"))
	require.NoError(t, err)
	defer inputFile.Close()

	// Create temporary output file
	buf := bytes.Buffer{}

	// Convert MPEG-TS to MP4
	err = MPEGTSToMP4(context.Background(), inputFile, &buf)
	require.NoError(t, err)
	require.Greater(t, buf.Len(), 0, "Output file should not be empty")
}
