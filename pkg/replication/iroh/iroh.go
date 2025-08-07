package iroh

import (
	"context"

	"stream.place/streamplace/pkg/log"

	irohStreamplace "github.com/n0-computer/iroh-streamplace/pkg/iroh_streamplace/generated/iroh_streamplace"
)

// IrohReplicator implements the replication mechanism using iroh
type IrohReplicator struct {
	peers []*irohStreamplace.PublicKey
	endpoint *irohStreamplace.SenderEndpoint
}

func NewIrohReplicator(peers []string) *IrohReplicator {
	endpoint := irohStreamplace.NewSenderEndpoint()

	nodeIds := make([]*irohStreamplace.PublicKey, len(peers))
	for i := range(peers) {
		nodeId := irohStreamplace.PublicKeyFromString(peers[i])
		nodeAddr := irohStreamplace.NewNodeAddr(nodeId, nil, nil)
		endpoint.AddPeer(nodeAddr)
		nodeIds[i] = nodeId
	}

	return &IrohReplicator {
		peers: nodeIds,
		endpoint: endpoint,
	}
}

func (rep *IrohReplicator) NewSegment(ctx context.Context, bs []byte) {
	for _, p := range rep.peers {
		go func(peer *irohStreamplace.PublicKey) {
			err := sendSegment(rep.endpoint, peer, bs)
			if err != nil {
				log.Log(ctx, "error replicating segment", "error", err)
			}
		}(p)
	}
}

func sendSegment(endpoint *irohStreamplace.SenderEndpoint, peer *irohStreamplace.PublicKey, bs []byte) error {
	endpoint.Send(peer, bs)
	return nil
}
