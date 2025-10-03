package iroh_replicator

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/bluesky-social/indigo/util"
	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/media"
)

type IrohSwarm struct {
	Node    *iroh_streamplace.Node
	DB      *iroh_streamplace.Db
	w       *iroh_streamplace.WriteScope
	mm      *media.MediaManager
	segChan chan *media.NewSegmentNotification
	nodeId  string
}

// A message saying "hey I ingested node data at this time"
type OriginInfo struct {
	NodeID string `json:"node_id"`
	Time   string `json:"time"`
}

func NewSwarm(ctx context.Context, tickets []string, secret []byte, mm *media.MediaManager) (*IrohSwarm, error) {
	ctx = log.WithLogValues(ctx, "func", "StartKV")

	log.Log(ctx, "Starting with tickets", "tickets", tickets)
	config := iroh_streamplace.Config{
		Key:             secret,
		Topic:           make([]byte, 32), // all zero topic for testing
		MaxSendDuration: 1000_000_000,     // 1s
	}
	log.Log(ctx, "Config created", "config", config)

	swarm := IrohSwarm{
		mm: mm,
	}

	node, err := iroh_streamplace.NodeReceiver(config, &swarm)
	if err != nil {
		return nil, fmt.Errorf("failed to create NodeSender: %w", err)
	}

	db := node.Db()
	w := node.NodeScope()

	swarm.DB = db
	swarm.w = w
	swarm.Node = node

	nodeId, err := node.NodeId()
	if err != nil {
		return nil, fmt.Errorf("failed to get NodeId: %w", err)
	}
	log.Log(ctx, "Node ID:", "node_id", nodeId)
	swarm.nodeId = nodeId.String()

	ticket, err := node.Ticket()
	if err != nil {
		return nil, fmt.Errorf("failed to get Ticket: %w", err)
	}
	log.Log(ctx, "Ticket:", "ticket", ticket)

	return &swarm, nil
}

var activeSubs = make(map[string]bool)

func (swarm *IrohSwarm) Start(ctx context.Context, tickets []string) error {
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

	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return swarm.startKV(ctx)
	})
	g.Go(func() error {
		return swarm.startSegmentSender(ctx)
	})
	return g.Wait()
}

func (swarm *IrohSwarm) startKV(ctx context.Context) error {
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
				if info.NodeID == swarm.nodeId {
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

func (swarm *IrohSwarm) startSegmentSender(ctx context.Context) error {
	ch := swarm.mm.NewSegment()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case not := <-ch:
			err := swarm.SendSegment(ctx, not)
			if err != nil {
				log.Error(ctx, "could not send segment to swarm", "error", err)
			}
			continue
		}
	}
}

func (swarm *IrohSwarm) HandleData(topic string, data []byte) {
	err := swarm.mm.ValidateMP4(context.Background(), bytes.NewReader(data), false)
	if err != nil {
		log.Error(context.Background(), "could not validate segment", "error", err)
	}
}

func (swarm *IrohSwarm) SendSegment(ctx context.Context, not *media.NewSegmentNotification) error {
	if !not.Local {
		return nil
	}
	originInfo := OriginInfo{
		NodeID: swarm.nodeId,
		Time:   not.Segment.StartTime.Format(util.ISO8601),
	}
	bs, err := json.Marshal(originInfo)
	if err != nil {
		log.Error(ctx, "could not marshal origin info", "error", err)
		return err
	}
	keyBs := []byte(not.Segment.RepoDID)
	err = swarm.w.Put(nil, keyBs, bs)
	if err != nil {
		log.Error(ctx, "could not put segment to swarm", "error", err)
		return err
	}
	err = swarm.Node.SendSegment(not.Segment.RepoDID, not.Data)
	if err != nil {
		log.Error(ctx, "could not send segment to swarm", "error", err)
		return err
	}
	return nil
}
