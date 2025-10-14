package iroh_replicator

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/bluesky-social/indigo/util"
	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/bus"
	"stream.place/streamplace/pkg/iroh/generated/iroh_streamplace"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/media"
	"stream.place/streamplace/pkg/streamplace"
)

type IrohSwarm struct {
	Node             *iroh_streamplace.Node
	DB               *iroh_streamplace.Db
	w                *iroh_streamplace.WriteScope
	mm               *media.MediaManager
	segChan          chan *media.NewSegmentNotification
	NodeID           string
	NodeTicket       string
	activeSubs       map[string]*OriginInfo
	handleDataScoped func(topic string, data []byte)
	bus              *bus.Bus
	originMutex      sync.Mutex
}

// A message saying "hey I ingested node data at this time"
type OriginInfo struct {
	NodeID string `json:"node_id"`
	Time   string `json:"time"`
}

func NewSwarm(ctx context.Context, tickets []string, secret []byte, topic []byte, mm *media.MediaManager, bus *bus.Bus) (*IrohSwarm, error) {
	ctx = log.WithLogValues(ctx, "func", "StartKV")

	if topic == nil {
		topic = make([]byte, 32)
		_, err := rand.Read(topic)
		if err != nil {
			return nil, fmt.Errorf("failed to generate random topic: %w", err)
		}
	}

	log.Log(ctx, "Starting with tickets", "tickets", tickets)
	config := iroh_streamplace.Config{
		Key:             secret,
		Topic:           topic,
		MaxSendDuration: 1000_000_000, // 1s
	}
	log.Log(ctx, "Config created", "config", config)

	swarm := IrohSwarm{
		mm:         mm,
		activeSubs: make(map[string]*OriginInfo),
		bus:        bus,
	}

	// workaround to get context into the HandleData callback
	swarm.handleDataScoped = func(topic string, data []byte) {
		if ctx.Err() != nil {
			return
		}
		err := swarm.mm.ValidateMP4(context.Background(), bytes.NewReader(data), false)
		if err != nil {
			log.Error(ctx, "could not validate segment", "error", err, "topic", topic, "data", len(data))
		}
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
	swarm.NodeID = nodeId.String()

	ticket, err := node.Ticket()
	if err != nil {
		return nil, fmt.Errorf("failed to get Ticket: %w", err)
	}
	swarm.NodeTicket = ticket

	return &swarm, nil
}

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
	g.Go(func() error {
		<-ctx.Done()
		return swarm.Node.Shutdown()
	})
	g.Go(func() error {
		return swarm.startBusSubscribe(ctx)
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
			log.Debug(ctx, "Got empty event from sub.NextRaw(), pausing for a second")
			time.Sleep(1 * time.Second)
			continue
		}
		switch item := (*ev).(type) {
		case iroh_streamplace.SubscribeItemEntry:
			keyStr := string(item.Key)
			valueStr := string(item.Value)
			log.Debug(ctx, "SubscribeItemEntry", "key", keyStr, "value", valueStr)
			if len(valueStr) > 0 && valueStr[0] != '{' {
				// not JSON, it's one of the rust messages
				log.Debug(ctx, "not JSON", "key", keyStr, "value", valueStr)
				continue
			}
			var info OriginInfo
			err := json.Unmarshal(item.Value, &info)
			if err != nil {
				log.Error(ctx, "could not unmarshal origin info", "error", err)
				continue
			}
			err = swarm.checkOrigins(ctx, keyStr, info.NodeID)
			if err != nil {
				log.Error(ctx, "could not check origins", "error", err)
				continue
			}
		case iroh_streamplace.SubscribeItemCurrentDone:
			log.Debug(ctx, "SubscribeItemCurrentDone", "currentDone", item)
		case iroh_streamplace.SubscribeItemExpired:
			log.Debug(ctx, "SubscribeItemExpired", "expired", item)
		case iroh_streamplace.SubscribeItemOther:
			log.Debug(ctx, "SubscribeItemOther", "other", item)
		}
	}
}

// subscribe to all streams
func (swarm *IrohSwarm) startBusSubscribe(ctx context.Context) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case msg := <-swarm.bus.Subscribe(""):
			if view, ok := msg.(*streamplace.BroadcastDefs_BroadcastOriginView); ok {
				log.Debug(ctx, "got broadcast origin view", "view", view)
				origin, ok := view.Record.Val.(*streamplace.BroadcastOrigin)
				if !ok {
					log.Error(ctx, "record is not a BroadcastOrigin", "record", view.Record)
					continue
				}
				if view.Author.Did != origin.Streamer {
					// currently, only streamers are allowed to advertise origins
					continue
				}
				if origin.IrohTicket == nil {
					log.Error(ctx, "origin has no iroh ticket", "origin", origin)
					continue
				}
				pubKey, err := iroh_streamplace.NodeIdFromTicket(*origin.IrohTicket)
				if err != nil {
					log.Error(ctx, "could not get node id from ticket", "error", err)
					continue
				}
				err = swarm.Node.AddTickets([]string{*origin.IrohTicket})
				if err != nil {
					log.Error(ctx, "could not add tickets", "error", err)
					continue
				}
				pubKeyStr := pubKey.String()
				err = swarm.checkOrigins(ctx, origin.Streamer, pubKeyStr)
				if err != nil {
					log.Error(ctx, "could not check origin", "error", err)
					continue
				}
			}
		}
	}
}

func (swarm *IrohSwarm) checkOrigins(ctx context.Context, streamer string, nodeID string) error {
	swarm.originMutex.Lock()
	defer swarm.originMutex.Unlock()
	oldSub, ok := swarm.activeSubs[streamer]
	if ok {
		if oldSub.NodeID == nodeID {
			log.Debug(ctx, "node hasn't changed", "streamer", streamer)
			// mmyep. same node still has the stream. great news.
			return nil
		}
		log.Log(ctx, "Stream origin changed, swapping to new node", "old_node", oldSub.NodeID, "new_node", nodeID, "streamer", streamer)
		pubKey, err := iroh_streamplace.PublicKeyFromString(oldSub.NodeID)
		if err != nil {
			log.Error(ctx, "could not create public key", "error", err)
			return err
		}
		// different node has the stream. we need to unsubscribe from the old node.
		err = swarm.Node.Unsubscribe(streamer, pubKey)
		if err != nil {
			log.Error(ctx, "could not unsubscribe from key", "error", err)
			return err
		}
		delete(swarm.activeSubs, streamer)
	}
	if nodeID == swarm.NodeID {
		log.Debug(ctx, "I already have this stream", "streamer", streamer)
		// oh, i have this stream. cool. do nothing.
		return nil
	}
	log.Log(ctx, "Subscribing to stream", "new_node", nodeID, "streamer", streamer)
	pubKey, err := iroh_streamplace.PublicKeyFromString(nodeID)
	if err != nil {
		log.Error(ctx, "could not create public key", "error", err)
		return err
	}
	err = swarm.Node.Subscribe(streamer, pubKey)
	if err != nil {
		log.Error(ctx, "could not subscribe to key", "error", err)
		return err
	}
	swarm.activeSubs[streamer] = &OriginInfo{
		NodeID: nodeID,
		Time:   time.Now().Format(util.ISO8601),
	}
	return nil
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
	swarm.handleDataScoped(topic, data)
}

func (swarm *IrohSwarm) SendSegment(ctx context.Context, not *media.NewSegmentNotification) error {
	if !not.Local {
		return nil
	}
	originInfo := OriginInfo{
		NodeID: swarm.NodeID,
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
