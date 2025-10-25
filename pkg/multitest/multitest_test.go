package multitest

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	lexutil "github.com/bluesky-social/indigo/lex/util"
	"github.com/bluesky-social/indigo/util"
	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/cmd"
	"stream.place/streamplace/pkg/crypto/spkey"
	"stream.place/streamplace/pkg/devenv"
	"stream.place/streamplace/pkg/gstinit"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/streamplace"
	"stream.place/streamplace/test/remote"
)

func TestMultinodeSyndication(t *testing.T) {
	if os.Getenv("GITHUB_ACTION") != "" {
		t.Skip("Skipping multitest in GitHub Actions")
	}
	gstinit.InitGST()
	dev := devenv.WithDevEnv(t)
	acct := dev.CreateAccount(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	node1 := startStreamplaceNode(t, dev)
	node2 := startStreamplaceNode(t, dev)
	node3 := startStreamplaceNode(t, dev)
	node1.StartStream(ctx, t, acct)
	node2.PlayStream(ctx, t, acct)
	node3.PlayStream(ctx, t, acct)
	<-ctx.Done()
}

var currentPort = 10000

func nextPort() int {
	currentPort++
	return currentPort
}

type TestNode struct {
	Env map[string]string
	Dev *devenv.DevEnv
}

func startStreamplaceNode(t *testing.T, dev *devenv.DevEnv) *TestNode {
	dataDir := t.TempDir()
	devAccountCreds := []string{}
	for _, acct := range dev.Accounts {
		devAccountCreds = append(devAccountCreds, fmt.Sprintf("%s=%s", acct.DID, acct.Password))
	}
	env := map[string]string{
		"SP_HTTP_ADDR":              fmt.Sprintf("127.0.0.1:%d", nextPort()),
		"SP_HTTP_INTERNAL_ADDR":     fmt.Sprintf("127.0.0.1:%d", nextPort()),
		"SP_RELAY_HOST":             strings.ReplaceAll(dev.PDSURL, "http://", "ws://"),
		"SP_PLC_URL":                dev.PLCURL,
		"SP_DATA_DIR":               dataDir,
		"SP_DEV_ACCOUNT_CREDS":      strings.Join(devAccountCreds, ","),
		"SP_STREAM_SESSION_TIMEOUT": "3s",
	}
	_, file, _, _ := runtime.Caller(0)
	buildDir := fmt.Sprintf("build-%s-%s", runtime.GOOS, runtime.GOARCH)
	abs, err := filepath.Abs(filepath.Join(filepath.Dir(file), "..", "..", buildDir, "streamplace"))
	require.NoError(t, err)
	// Run the streamplace binary at abs with the environment env
	cmd := exec.Command(abs)
	cmd.Env = []string{}
	for k, v := range env {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Start()
	require.NoError(t, err)
	t.Cleanup(func() {
		err := cmd.Process.Kill()
		require.NoError(t, err)
		_, err = cmd.Process.Wait()
		require.NoError(t, err)
	})
	// Wait for the streamplace node to be ready by polling the health endpoint
	healthz := fmt.Sprintf("http://%s/api/healthz", env["SP_HTTP_ADDR"])
	client := &http.Client{Timeout: 2 * time.Second}
	for {
		resp, err := client.Get(healthz)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == 200 {
				break
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	return &TestNode{
		Env: env,
		Dev: dev,
	}
}

func (node *TestNode) StartStream(ctx context.Context, t *testing.T, acct *devenv.DevEnvAccount) {
	priv, pub, err := spkey.GenerateStreamKeyForDID(acct.DID)
	require.NoError(t, err)
	createdBy := "multitest"
	streamKey := streamplace.Key{
		SigningKey: pub.DIDKey(),
		CreatedAt:  time.Now().Format(util.ISO8601),
		CreatedBy:  &createdBy,
	}
	_, err = comatproto.RepoCreateRecord(context.TODO(), acct.XRPC, &comatproto.RepoCreateRecord_Input{
		Collection: "place.stream.key",
		Repo:       acct.DID,
		Record:     &lexutil.LexiconTypeDecoder{Val: &streamKey},
	})
	require.NoError(t, err)
	log.Log(context.Background(), "created stream key", "did", acct.DID, "pub", pub.DIDKey())
	whip := &cmd.WHIPClient{
		StreamKey: priv,
		File:      remote.RemoteFixture("3188c071b354f2e548d7f2d332699758e8e3ab1600280e5b07cb67eedc64f274/BigBuckBunny_1sGOP_240p30_NoBframes.mp4"),
		Endpoint:  fmt.Sprintf("http://%s", node.Env["SP_HTTP_ADDR"]),
		Count:     1,
	}

	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return whip.WHIP(ctx)
	})
}

func (node *TestNode) PlayStream(ctx context.Context, t *testing.T, acct *devenv.DevEnvAccount) {
	whep := &cmd.WHEPClient{
		Endpoint: fmt.Sprintf("http://%s/api/playback/%s/webrtc", node.Env["SP_HTTP_ADDR"], acct.DID),
		Count:    1,
	}
	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return whep.WHEP(ctx)
	})
	start := time.Now()
	var prevVideoTotal int
	var prevAudioTotal int
	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(5 * time.Second):
				stats := whep.Stats[0]
				videoStats := stats["video"]
				audioStats := stats["audio"]
				if videoStats.Total == prevVideoTotal || audioStats.Total == prevAudioTotal {
					require.FailNowf(t, "stream playback stalled", "video: %d, audio: %d, elapsed: %s", videoStats.Total, audioStats.Total, time.Since(start))
				}
				prevVideoTotal = videoStats.Total
				prevAudioTotal = audioStats.Total
				log.Log(ctx, "stream playback", "video", videoStats.Total, "audio", audioStats.Total, "elapsed", time.Since(start))
			}
		}
	})
}
