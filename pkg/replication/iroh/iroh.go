package iroh

import (
	"context"

	"stream.place/streamplace/pkg/log"

	irohStreamplace "stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
)

// IrohReplicator implements the replication mechanism using iroh
type IrohReplicator struct {
	peers  []*irohStreamplace.PublicKey
	sender *irohStreamplace.Sender
}

func NewIrohReplicator(ctx context.Context, ep *irohStreamplace.Endpoint, peers []string) (*IrohReplicator, error) {
	sender, err := irohStreamplace.NewSender(ep)
	if err.AsError() != nil {
		return nil, err.AsError()
	}

	nodeIds := make([]*irohStreamplace.PublicKey, len(peers))
	for i := range peers {
		nodeId, err := irohStreamplace.PublicKeyFromString(peers[i])
		if err.AsError() != nil {
			log.Log(ctx, "invalid Node ID", "warning", err.Error())
			continue
		}
		nodeAddr := irohStreamplace.NewNodeAddr(nodeId, nil, nil)
		err = sender.AddPeer(nodeAddr)
		if err.AsError() != nil {
			log.Log(ctx, "failed to connect to peer", "warning", err.Error())
			continue
		}
		nodeIds[i] = nodeId
	}

	return &IrohReplicator{
		peers:  nodeIds,
		sender: sender,
	}, nil
}

func (rep *IrohReplicator) NewSegment(ctx context.Context, bs []byte) {
	for _, p := range rep.peers {
		go func(peer *irohStreamplace.PublicKey) {
			err := sendSegment(rep.sender, peer, bs)
			if err != nil {
				log.Log(ctx, "error replicating segment", "error", err)
			}
		}(p)
	}
}

func sendSegment(endpoint *irohStreamplace.Sender, peer *irohStreamplace.PublicKey, bs []byte) error {
	return endpoint.Send(peer, bs).AsError()
}
