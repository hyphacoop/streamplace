package media

import (
	"context"
	"io"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/goleak"
	"stream.place/streamplace/pkg/gstinit"
	"stream.place/streamplace/pkg/media/segchanman"
)

func TestPacketize(t *testing.T) {
	gstinit.InitGST()
	before := getLeakCount(t)
	defer checkGStreamerLeaks(t, before)
	ignore := goleak.IgnoreCurrent()
	defer goleak.VerifyNone(t, ignore)
	filename := getFixture("sample-segment.mp4")
	inputFile, err := os.Open(filename)
	require.NoError(t, err)
	defer inputFile.Close()

	bs, err := io.ReadAll(inputFile)
	require.NoError(t, err)

	testSeg := &segchanman.Seg{
		Data:     bs,
		Filepath: filename,
	}

	packet, err := Packetize(context.Background(), testSeg)
	require.NoError(t, err)
	require.NotNil(t, packet)
	require.Equal(t, 49, len(packet.Video))
	require.Equal(t, 40, len(packet.Audio))
	require.Equal(t, time.Duration(800*time.Millisecond), packet.Duration)
}
