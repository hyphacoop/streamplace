package iroh_streamplace

import (
	_ "stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
)

// #cgo pkg-config: streamplacedeps
// #cgo darwin LDFLAGS: -framework Security -framework SystemConfiguration
import "C"
