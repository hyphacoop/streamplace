package iroh

import (
	"context"

	"stream.place/streamplace/pkg/log"

	irohStreamplace "github.com/n0-computer/iroh-streamplace/pkg/iroh_streamplace/generated/iroh_streamplace"
)

// iroh replication mechanism
type IrohReplicator struct {
	peers []*irohStreamplace.PublicKey
	endpoint *irohStreamplace.SenderEndpoint
}

func NewIrohReplicator(peers []string) *IrohReplicator {
	endpoint := irohStreamplace.NewSenderEndpoint()
	// TODO: add addrs to the endpoint

	nodeAddrs := make([]*irohStreamplace.PublicKey, len(peers))
	for i := range(peers) {
		addr := irohStreamplace.PublicKeyFromString(peers[i])
		nodeAddrs[i] = addr
	}

	return &IrohReplicator {
		peers: nodeAddrs,
		endpoint: endpoint,
	}
}

func (rep *IrohReplicator) NewSegment(ctx context.Context, bs []byte) {
	for _, p := range rep.peers {
		go func(peer *irohStreamplace.PublicKey) {
			ctx := log.WithLogValues(ctx, "peer", peer.FmtShort())
			err := sendSegment(ctx, rep.endpoint, peer, bs)
			if err != nil {
				log.Log(ctx, "error replicating segment", "error", err)
			}
		}(p)
	}
}

func sendSegment(ctx context.Context, endpoint *irohStreamplace.SenderEndpoint, peer *irohStreamplace.PublicKey, bs []byte) error {
	endpoint.Send(peer, bs)
	return nil
}
