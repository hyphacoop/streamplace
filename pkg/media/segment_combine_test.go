package media

import (
	"context"
	"fmt"
	"io"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/aqio"
	"stream.place/streamplace/pkg/log"
)

func TestCombineSegmentsUnsigned(t *testing.T) {
	withNoGSTLeaks(t, func() {
		g, _ := errgroup.WithContext(context.Background())
		for range streamplaceTestCount {
			g.Go(func() error {
				return innerTestClip(t)
			})
		}
		err := g.Wait()
		require.NoError(t, err)
	})
}

func innerTestClip(t *testing.T) error {
	ctx := log.WithDebugValue(context.Background(), map[string]map[string]int{"func": {"ConcatDemuxBin": 9, "ConcatBin": 9}})
	fName := getFixture("sample-segment.mp4")
	inputFiles := []string{fName, fName, fName}
	inputFds := make([]io.ReadSeeker, len(inputFiles))
	for i, fName := range inputFiles {
		fd, err := os.Open(fName)
		if err != nil {
			return fmt.Errorf("unable to open segment file: %w", err)
		}
		inputFds[i] = fd
	}
	buf := aqio.NewReadWriteSeeker([]byte{})
	err := CombineSegmentsUnsigned(ctx, inputFds, buf)
	require.NoError(t, err)
	slice, err := buf.Bytes()
	require.NoError(t, err)
	require.Greater(t, len(slice), 2900000)
	require.Less(t, len(slice), 3100000)
	return nil
}
