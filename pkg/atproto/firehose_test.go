package atproto

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	lexutil "github.com/bluesky-social/indigo/lex/util"
	"github.com/bluesky-social/indigo/util"
	"github.com/cenkalti/backoff"
	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/bus"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/devenv"
	"stream.place/streamplace/pkg/model"
	"stream.place/streamplace/pkg/statedb"
	"stream.place/streamplace/pkg/streamplace"
)

func TestFirehose(t *testing.T) {
	dev := devenv.WithDevEnv(t)
	t.Logf("dev: %+v", dev)
	cli := config.CLI{
		PublicHost: "example.com",
		DBURL:      ":memory:",
		RelayHost:  strings.ReplaceAll(dev.PDSURL, "http://", "ws://"),
		PLCURL:     dev.PLCURL,
	}
	t.Logf("cli: %+v", cli)
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

	done := make(chan struct{})

	go func() {
		err := atsync.StartFirehose(ctx)
		require.NoError(t, err)
		close(done)
	}()

	user := dev.CreateAccount(t)
	user2 := dev.CreateAccount(t)

	msg := &streamplace.ChatMessage{
		LexiconTypeID: "place.stream.chat.message",
		Text:          "Hello, world!",
		CreatedAt:     time.Now().Format(util.ISO8601),
		Streamer:      user.DID,
	}

	_, err = comatproto.RepoCreateRecord(ctx, user.XRPC, &comatproto.RepoCreateRecord_Input{
		Collection: "place.stream.chat.message",
		Repo:       user.DID,
		Record:     &lexutil.LexiconTypeDecoder{Val: msg},
	})
	require.NoError(t, err)

	msg2 := &streamplace.ChatMessage{
		LexiconTypeID: "place.stream.chat.message",
		Text:          "Hello, world 2!",
		CreatedAt:     time.Now().Format(util.ISO8601),
		Streamer:      user.DID,
	}

	_, err = comatproto.RepoCreateRecord(ctx, user2.XRPC, &comatproto.RepoCreateRecord_Input{
		Collection: "place.stream.chat.message",
		Repo:       user2.DID,
		Record:     &lexutil.LexiconTypeDecoder{Val: msg2},
	})
	require.NoError(t, err)

	messages := []*streamplace.ChatDefs_MessageView{}
	err = untilNoErrors(t, func() error {
		messages, err = mod.MostRecentChatMessages(user.DID)
		if err != nil {
			return err
		}
		if len(messages) != 2 {
			return fmt.Errorf("expected 1 message, got %d", len(messages))
		}
		return nil
	})
	require.NoError(t, err)
	require.Equal(t, msg.Text, messages[1].Record.Val.(*streamplace.ChatMessage).Text)
	require.Equal(t, msg2.Text, messages[0].Record.Val.(*streamplace.ChatMessage).Text)

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
