package statedb

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/model"
)

func TestPostgresLocks(t *testing.T) {
	cli := config.CLI{
		DBURL: "postgresql://postgres:postgres@localhost:5432/streamplace",
	}
	mod, err := model.MakeDB(":memory:")
	require.NoError(t, err)
	state, err := MakeDB(&cli, nil, mod)
	require.NoError(t, err)

	unlock, err := state.GetNamedLock("test")
	t.Log("got lock")
	require.NoError(t, err)
	require.NotNil(t, unlock)

	shouldBeLocked := true

	done := make(chan struct{})

	go func() {
		unlock2, err := state.GetNamedLock("test")
		t.Log("got lock 2")
		require.Equal(t, shouldBeLocked, false)
		require.NoError(t, err)
		require.NotNil(t, unlock2)
		unlock2()
		close(done)
	}()

	time.Sleep(1 * time.Second)

	t.Log("unlocking")
	shouldBeLocked = false
	unlock()
	t.Log("unlocked")

	select {
	case <-done:
	case <-time.After(1 * time.Second):
		require.Fail(t, "lock not released")
	}
}
