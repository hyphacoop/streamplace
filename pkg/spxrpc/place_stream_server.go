package spxrpc

import (
	"context"
	"time"

	placestreamtypes "stream.place/streamplace/pkg/streamplace"
)

func (s *Server) handlePlaceStreamServerGetServerTime(ctx context.Context) (*placestreamtypes.ServerGetServerTime_Output, error) {
	serverTime := time.Now().UTC().Format(time.RFC3339)
	return &placestreamtypes.ServerGetServerTime_Output{
		ServerTime: serverTime,
	}, nil
}
