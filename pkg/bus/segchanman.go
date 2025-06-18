package bus

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/otel"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/spmetrics"
)

// it's a segment channel manager, you see

type Seg struct {
	Filepath       string
	Data           []byte
	PacketizedData *PacketizedSegment
}

type PacketizedSegment struct {
	Video    [][]byte
	Audio    [][]byte
	Duration time.Duration
}

type SegChan struct {
	C   chan *Seg
	buf []*Seg
}

var bufSize = 10

func segChanKey(user string, rendition string) string {
	return fmt.Sprintf("%s::%s", user, rendition)
}

// get a channel to subscribe to new segments for a given user and rendition
func (b *Bus) SubscribeSegment(ctx context.Context, user string, rendition string) *SegChan {
	return b.SubscribeSegmentBuf(ctx, user, rendition, 0)
}

// get a channel to subscribe to new segments for a given user and rendition,
// starting with bufSize cached segments that we already have
func (b *Bus) SubscribeSegmentBuf(ctx context.Context, user string, rendition string, bufSize int) *SegChan {
	key := segChanKey(user, rendition)
	b.segChansMutex.Lock()
	defer b.segChansMutex.Unlock()
	chs, ok := b.segChans[key]
	if !ok {
		chs = []*SegChan{}
		b.segChans[key] = chs
	}
	ch := make(chan *Seg)
	b.segBufMutex.RLock()
	defer b.segBufMutex.RUnlock()
	curBuf, ok := b.segBuf[key]
	myBuf := []*Seg{}
	if ok {
		if bufSize > len(curBuf) {
			bufSize = len(curBuf)
		}
		myBuf = curBuf[len(curBuf)-bufSize:]
	}
	segChan := &SegChan{C: ch, buf: myBuf}
	chs = append(chs, &SegChan{C: ch, buf: myBuf})
	b.segChans[key] = chs
	spmetrics.SegmentSubscriptionsOpen.WithLabelValues(user, rendition).Set(float64(len(chs)))
	return segChan
}

// unsubscribe from a channel for a given user and rendition
func (b *Bus) UnsubscribeSegment(ctx context.Context, user string, rendition string, ch *SegChan) {
	key := segChanKey(user, rendition)
	b.segChansMutex.Lock()
	defer b.segChansMutex.Unlock()
	chs, ok := b.segChans[key]
	if !ok {
		return
	}
	for i, c := range chs {
		if c == ch {
			chs = append(chs[:i], chs[i+1:]...)
			break
		}
	}
	spmetrics.SegmentSubscriptionsOpen.WithLabelValues(user, rendition).Set(float64(len(chs)))
	b.segChans[key] = chs
}

func (b *Bus) PublishSegment(ctx context.Context, user string, rendition string, seg *Seg) {
	ctx, span := otel.Tracer("signer").Start(ctx, "PublishSegment")
	defer span.End()
	key := segChanKey(user, rendition)
	b.segChansMutex.Lock()
	defer b.segChansMutex.Unlock()
	b.segBufMutex.Lock()
	defer b.segBufMutex.Unlock()
	curBuf, ok := b.segBuf[key]
	if !ok {
		curBuf = []*Seg{}
		b.segBuf[key] = curBuf
	}
	curBuf = append(curBuf, seg)
	if len(curBuf) > bufSize {
		curBuf = curBuf[1:]
	}
	b.segBuf[key] = curBuf
	chs, ok := b.segChans[key]
	if !ok {
		return
	}
	for _, ch := range chs {
		go func(segChan *SegChan) {
			select {
			case segChan.C <- seg:
			case <-ctx.Done():
				return
			case <-time.After(1 * time.Minute):
				log.Warn(ctx, "failed to send segment to channel, timing out", "user", user, "rendition", rendition)
			}

		}(ch)
	}
}
