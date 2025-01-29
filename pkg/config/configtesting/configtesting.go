package ct

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/config"
)

func CLI(t *testing.T, cli *config.CLI) *config.CLI {
	dir, err := os.MkdirTemp("", "aq-testing-*")
	require.NoError(t, err)
	t.Cleanup(func() {
		os.RemoveAll(dir)
	})
	cli.DataDir = dir
	return cli
}
