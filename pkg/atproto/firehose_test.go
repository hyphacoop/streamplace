package atproto

import (
	"context"
	"fmt"
	"testing"
	"time"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	lexutil "github.com/bluesky-social/indigo/lex/util"
	"github.com/bluesky-social/indigo/util"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/cenkalti/backoff"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/aqhttp"
	"stream.place/streamplace/pkg/bus"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/model"
	"stream.place/streamplace/pkg/statedb"
	"stream.place/streamplace/pkg/streamplace"
)

func TestFirehose(t *testing.T) {
	cli := config.CLI{
		PublicHost: "example.com",
		DBURL:      ":memory:",
		RelayHost:  "ws://localhost:37751",
		PLCURL:     "http://localhost:45635",
	}
	b := bus.NewBus()
	cli.DataDir = t.TempDir()
	mod, err := model.MakeDB(":memory:")
	require.NoError(t, err)
	state, err := statedb.MakeDB(&cli, nil, mod)
	require.NoError(t, err)
	atsync := &ATProtoSynchronizer{
		CLI:        &cli,
		StatefulDB: state,
		Model:      mod,
		Bus:        b,
	}

	ctx, cancel := context.WithCancel(context.Background())

	xrpcc := &xrpc.Client{
		Host:   "http://localhost:37751",
		Client: &aqhttp.Client,
	}

	uu, err := uuid.NewRandom()
	require.NoError(t, err)

	handle := fmt.Sprintf("sp-%s.test", uu.String()[:8])
	email := fmt.Sprintf("%s@example.com", handle)
	password := "test"

	out, err := comatproto.ServerCreateAccount(ctx, xrpcc, &comatproto.ServerCreateAccount_Input{
		Handle:   handle,
		Email:    &email,
		Password: &password,
	})
	require.NoError(t, err)
	log.Log(ctx, "created account", "did", out.Did, "handle", out.Handle)

	done := make(chan struct{})

	go func() {
		err := atsync.StartFirehose(ctx)
		require.NoError(t, err)
		close(done)
	}()

	session, err := comatproto.ServerCreateSession(ctx, xrpcc, &comatproto.ServerCreateSession_Input{
		Identifier: out.Handle,
		Password:   password,
	})
	require.NoError(t, err)

	xrpcc = &xrpc.Client{
		Host:   "http://localhost:37751",
		Client: &aqhttp.Client,
		Auth: &xrpc.AuthInfo{
			Did:        out.Did,
			AccessJwt:  session.AccessJwt,
			RefreshJwt: session.RefreshJwt,
			Handle:     out.Handle,
		},
	}

	msg := &streamplace.ChatMessage{
		LexiconTypeID: "place.stream.chat.message",
		Text:          "Hello, world!",
		CreatedAt:     time.Now().Format(util.ISO8601),
		Streamer:      out.Did,
	}

	_, err = comatproto.RepoCreateRecord(ctx, xrpcc, &comatproto.RepoCreateRecord_Input{
		Collection: "place.stream.chat.message",
		Repo:       out.Did,
		Record:     &lexutil.LexiconTypeDecoder{Val: msg},
	})
	require.NoError(t, err)

	messages := []*streamplace.ChatDefs_MessageView{}
	err = untilNoErrors(t, func() error {
		messages, err = mod.MostRecentChatMessages(out.Did)
		if err != nil {
			return err
		}
		if len(messages) != 1 {
			return fmt.Errorf("expected 1 message, got %d", len(messages))
		}
		return nil
	})
	require.NoError(t, err)
	require.Equal(t, msg.Text, messages[0].Record.Val.(*streamplace.ChatMessage).Text)

	cancel()
	<-done
}

func untilNoErrors(t *testing.T, f func() error) error {
	ticker := backoff.NewTicker(backoff.NewExponentialBackOff())
	defer ticker.Stop()
	var err error
	for i := 0; i < 10; i++ {
		err = f()
		if err == nil {
			return err
		}
		if i < 9 {
			<-ticker.C
		}
	}
	return err
}
