package iroh_streamplace

import (
	_ "stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
)

// #cgo LDFLAGS: -L../../target/release -liroh_streamplace -lm
// #cgo darwin LDFLAGS: -framework Security -framework SystemConfiguration
import "C"
