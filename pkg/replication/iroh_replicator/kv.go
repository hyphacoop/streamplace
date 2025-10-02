package iroh_replicator

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
	"stream.place/streamplace/pkg/log"
)

type SwarmKV struct {
	Node *iroh_streamplace.Node
	DB   *iroh_streamplace.Db
	w    *iroh_streamplace.WriteScope
}

// A message saying "hey I ingested node data at this time"
type OriginInfo struct {
	NodeID string `json:"node_id"`
	Time   string `json:"time"`
}

type DataHandler struct{}

func (handler *DataHandler) HandleData(topic string, data []byte) {
	log.Log(context.Background(), "HandleData", "topic", topic, "data", len(data))
}

func StartKV(ctx context.Context, tickets []string, secret []byte) (*SwarmKV, error) {
	handler := &DataHandler{}
	ctx = log.WithLogValues(ctx, "func", "StartKV")

	log.Log(ctx, "Starting with tickets", "tickets", tickets)
	config := iroh_streamplace.Config{
		Key:             secret,
		Topic:           make([]byte, 32), // all zero topic for testing
		MaxSendDuration: 1000_000_000,     // 1s
	}
	log.Log(ctx, "Config created", "config", config)
	node, err := iroh_streamplace.NodeReceiver(config, handler)
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
		Node: node,
		DB:   db,
		w:    w,
	}
	return &swarm, nil
}

var activeSubs = make(map[string]bool)

func (swarm *SwarmKV) Start(ctx context.Context, tickets []string) error {
	if len(tickets) > 0 {
		err := swarm.Node.JoinPeers(tickets)
		if err != nil {
			return fmt.Errorf("failed to join peers: %w", err)
		}
	}

	nodeId, err := swarm.Node.NodeId()
	if err != nil {
		return fmt.Errorf("failed to get node id: %w", err)
	}
	nodeIdStr := nodeId.String()
	log.Log(ctx, "Node ID:", "node_id", nodeIdStr)

	sub := swarm.DB.Subscribe(iroh_streamplace.NewFilter())
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
			var info OriginInfo
			err := json.Unmarshal(item.Value, &info)
			if err != nil {
				log.Error(ctx, "could not unmarshal origin info", "error", err)
				continue
			}
			if !activeSubs[keyStr] {
				if info.NodeID == nodeIdStr {
					activeSubs[keyStr] = true
					continue
				}
				pubKey, err := iroh_streamplace.PublicKeyFromString(info.NodeID)
				if err != nil {
					log.Error(ctx, "could not create public key", "error", err)
					continue
				}
				activeSubs[keyStr] = true
				err = swarm.Node.Subscribe(keyStr, pubKey)
				if err != nil {
					log.Error(ctx, "could not subscribe to key", "error", err)
					continue
				}
			}

		case iroh_streamplace.SubscribeItemCurrentDone:
			log.Log(ctx, "SubscribeItemCurrentDone", "currentDone", item)
		case iroh_streamplace.SubscribeItemExpired:
			log.Log(ctx, "SubscribeItemExpired", "expired", item)
		case iroh_streamplace.SubscribeItemOther:
			log.Log(ctx, "SubscribeItemOther", "other", item)
		}
	}
}

func (swarm *SwarmKV) Put(ctx context.Context, key string, value []byte) error {
	// streamerBs := []byte(streamer)
	keyBs := []byte(key)
	return swarm.w.Put(nil, keyBs, value)
}
