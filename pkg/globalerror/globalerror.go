package globalerror

import (
	"fmt"
	"path/filepath"
	"runtime"
	"sync"
)

var GlobalErrors []error
var mut sync.Mutex

func GlobalError(err error) {
	if GlobalErrors == nil {
		return
	}
	_, file, line, _ := runtime.Caller(1)

	go func() {
		mut.Lock()
		defer mut.Unlock()
		_, myfile, _, _ := runtime.Caller(0)
		// This assumes that the root directory of streamplace is two levels above this folder.
		// If that changes, please update this rootDir resolution.
		rootDir := filepath.Join(filepath.Dir(myfile), "..", "..")
		rel, _ := filepath.Rel(rootDir, file)
		GlobalErrors = append(GlobalErrors, fmt.Errorf("%s:%d: %w", rel, line, err))
	}()
}
