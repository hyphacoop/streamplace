package iroh_replicator

import (
	"context"
	"fmt"
	"time"

	"stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
	"stream.place/streamplace/pkg/log"
)

type SwarmKV struct {
	node *iroh_streamplace.Node
	db   *iroh_streamplace.Db
	w    *iroh_streamplace.WriteScope
}

func StartKV(ctx context.Context, tickets []string, secret []byte) (*SwarmKV, error) {
	ctx = log.WithLogValues(ctx, "func", "StartKV")

	log.Log(ctx, "Starting with tickets", "tickets", tickets)
	config := iroh_streamplace.Config{
		Key:             secret,
		Topic:           make([]byte, 32), // all zero topic for testing
		MaxSendDuration: 1000_000_000,     // 1s
	}
	log.Log(ctx, "Config created", "config", config)
	node, err := iroh_streamplace.NodeSender(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create NodeSender: %w", err)
	}

	db := node.Db()
	w := node.NodeScope()

	node_id, err := node.NodeId()
	if err != nil {
		return nil, fmt.Errorf("failed to get NodeId: %w", err)
	}
	log.Log(ctx, "Node ID:", "node_id", node_id)

	ticket, err := node.Ticket()
	if err != nil {
		return nil, fmt.Errorf("failed to get Ticket: %w", err)
	}
	log.Log(ctx, "Ticket:", "ticket", ticket)

	swarm := SwarmKV{
		node: node,
		db:   db,
		w:    w,
	}
	return &swarm, nil
}

func (swarm *SwarmKV) Start(ctx context.Context, tickets []string) error {
	if len(tickets) > 0 {
		err := swarm.node.JoinPeers(tickets)
		if err != nil {
			return fmt.Errorf("failed to join peers: %w", err)
		}
	}

	sub := swarm.db.Subscribe(iroh_streamplace.NewFilter())
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		ev, err := sub.NextRaw()
		if err != nil {
			return fmt.Errorf("failed to get next subscription event: %w", err)
		}
		if ev == nil {
			log.Log(ctx, "Got empty event from sub.NextRaw(), pausing for a second")
			time.Sleep(1 * time.Second)
			continue
		}
		switch item := (*ev).(type) {
		case iroh_streamplace.SubscribeItemEntry:
			keyStr := string(item.Key)
			valueStr := string(item.Value)
			log.Log(ctx, "SubscribeItemEntry", "key", keyStr, "value", valueStr)

		case iroh_streamplace.SubscribeItemCurrentDone:
			log.Log(ctx, "SubscribeItemCurrentDone", "currentDone", item)
		case iroh_streamplace.SubscribeItemExpired:
			log.Log(ctx, "SubscribeItemExpired", "expired", item)
		case iroh_streamplace.SubscribeItemOther:
			log.Log(ctx, "SubscribeItemOther", "other", item)
		}
	}
}

func (swarm *SwarmKV) Put(ctx context.Context, key, value string) error {
	// streamerBs := []byte(streamer)
	keyBs := []byte(key)
	valueBs := []byte(value)
	return swarm.w.Put(nil, keyBs, valueBs)
}
