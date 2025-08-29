package devenv

import (
	"bufio"
	"encoding/json"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
)

type DevEnv struct {
	PDSURL string `json:"pds-url"`
	PLCURL string `json:"plc-url"`
}

func WithDevEnv(t *testing.T) *DevEnv {
	_, filename, _, _ := runtime.Caller(0)
	cmd := exec.Command("node", "../../js/dev-env/run.mjs")
	cmd.Dir = filepath.Dir(filename)

	// Start the command and get pipes for streaming output
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		t.Logf("Error getting stdout pipe: %v", err)
		t.FailNow()
	}

	if err := cmd.Start(); err != nil {
		t.Logf("Error starting dev env: %v", err)
		t.FailNow()
	}

	var env DevEnv

	scanner := bufio.NewScanner(stdout)
	scanner.Scan()
	err = json.Unmarshal(scanner.Bytes(), &env)
	if err != nil {
		t.Logf("Error unmarshalling dev-env stdout: %v", err)
		t.FailNow()
	}

	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			t.Logf("dev-env stdout: %s", scanner.Text())
			if scanner.Err() != nil {
				return
			}
		}
	}()

	// Ensure cleanup happens when test finishes
	t.Cleanup(func() {
		t.Logf("killing dev env")
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
			_ = cmd.Wait()
		}
	})

	return &env
}
