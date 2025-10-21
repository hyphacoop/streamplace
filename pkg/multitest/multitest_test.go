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
)

func TestMultinodeSyndication(t *testing.T) {
	gstinit.InitGST()
	dev := devenv.WithDevEnv(t)
	acct := dev.CreateAccount(t)
	node1 := startStreamplaceNode(t, dev)
	node2 := startStreamplaceNode(t, dev)
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
		File:      "/home/iameli/testvids/RocketLeague_1h55m_1sGOP_1080p60_NoBframes.mp4",
		Endpoint:  fmt.Sprintf("http://%s", node1.Env["SP_HTTP_ADDR"]),
		Count:     1,
	}

	whep := &cmd.WHEPClient{
		Endpoint: fmt.Sprintf("http://%s/api/playback/%s/webrtc", node2.Env["SP_HTTP_ADDR"], acct.DID),
		Count:    1,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return whip.WHIP(ctx)
	})
	g.Go(func() error {
		return whep.WHEP(ctx)
	})

	<-ctx.Done()

	err = g.Wait()
	require.ErrorIs(t, err, context.DeadlineExceeded)
	stats := whep.Stats[0]
	videoStats := stats["video"]
	audioStats := stats["audio"]
	require.Greater(t, videoStats.Total, 0)
	require.Greater(t, audioStats.Total, 0)
}

var currentPort = 10000

func nextPort() int {
	currentPort++
	return currentPort
}

type TestNode struct {
	Env map[string]string
}

func startStreamplaceNode(t *testing.T, dev *devenv.DevEnv) *TestNode {
	dataDir := t.TempDir()
	devAccountCreds := []string{}
	for _, acct := range dev.Accounts {
		devAccountCreds = append(devAccountCreds, fmt.Sprintf("%s=%s", acct.DID, acct.Password))
	}
	env := map[string]string{
		"SP_HTTP_ADDR":          fmt.Sprintf("127.0.0.1:%d", nextPort()),
		"SP_HTTP_INTERNAL_ADDR": fmt.Sprintf("127.0.0.1:%d", nextPort()),
		"SP_RELAY_HOST":         strings.ReplaceAll(dev.PDSURL, "http://", "ws://"),
		"SP_PLC_URL":            dev.PLCURL,
		"SP_DATA_DIR":           dataDir,
		"SP_DEV_ACCOUNT_CREDS":  strings.Join(devAccountCreds, ","),
	}
	_, file, _, _ := runtime.Caller(0)
	abs, err := filepath.Abs(filepath.Join(filepath.Dir(file), "..", "..", "build-linux-amd64", "streamplace"))
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
	}
}
