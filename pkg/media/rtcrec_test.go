package media

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/pion/webrtc/v4"
	"github.com/stretchr/testify/require"
	"go.uber.org/goleak"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/crypto/spkey"
	"stream.place/streamplace/pkg/globalerror"
	"stream.place/streamplace/pkg/rtcrec"
	"stream.place/streamplace/test/remote"
)

var RTCRecTestCases = []struct {
	name        string
	fatalErrors bool
	fixture     string
}{
	{
		name:        "IntermittentTracks",
		fatalErrors: false,
		fixture:     getFixture("intermittent-tracks.cbor"),
	},
	{
		name:        "SegmentConvergenceIssues",
		fatalErrors: true,
		fixture:     remote.RemoteFixture("6a1fb84e3c23405fc53161f59d5b837839c4889fc1a96533c82fb44fafc51d27/2025-11-14T22-41-20-399Z.cbor"),
	},
}

func TestRTCRecording(t *testing.T) {
	withNoGSTLeaks(t, func() {
		previous := FatalSegmentationErrors
		defer func() {
			FatalSegmentationErrors = previous
		}()
		globalerror.GlobalErrors = []error{}
		ctx := context.Background()
		dir, err := os.MkdirTemp("", "rtcrec-test-*")
		require.NoError(t, err)
		defer os.RemoveAll(dir)
		cli := &config.CLI{}
		fs := cli.NewFlagSet("rtcrec-test")
		err = cli.Parse(fs, []string{"--data-dir", dir, "-wide-open=true"})
		require.NoError(t, err)
		mm, err := MakeMediaManager(context.Background(), cli, nil, nil, nil, nil)
		require.NoError(t, err)
		priv, pub, err := spkey.GenerateStreamKey()
		require.NoError(t, err)
		signer, err := spkey.KeyToSigner(priv)
		require.NoError(t, err)
		mediaSigner, err := MakeMediaSigner(ctx, cli, pub.DIDKey(), signer, nil)
		require.NoError(t, err)
		// ctx := context.Background()
		// mm, ms := getStaticTestMediaManager(t)
		for _, testCase := range RTCRecTestCases {
			t.Run(testCase.name, func(t *testing.T) {
				cur := goleak.IgnoreCurrent()
				defer goleak.VerifyNone(t, cur)
				FatalSegmentationErrors = testCase.fatalErrors
				fd, err := os.Open(testCase.fixture)
				require.NoError(t, err)
				defer fd.Close()
				pc, err := rtcrec.NewReplayPeerConnection(ctx, fd)
				require.NoError(t, err)
				done := make(chan error)
				_, err = mm.WebRTCIngest(ctx, &webrtc.SessionDescription{SDP: "placeholder"}, mediaSigner, pc, done)
				require.NoError(t, err)
				// fmt.Println(answer.SDP)
				pipelineError := <-done
				require.NoError(t, pipelineError)
				for _, err := range globalerror.GlobalErrors {
					fmt.Printf("got error, non-fatal for now: %v\n", err)
				}
			})
		}
	})
}
