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

func segChanKey(user string, rendition string) string {
	return fmt.Sprintf("%s::%s", user, rendition)
}

func (b *Bus) SubscribeSegment(ctx context.Context, user string, rendition string) <-chan *Seg {
	key := segChanKey(user, rendition)
	b.segChansMutex.Lock()
	defer b.segChansMutex.Unlock()
	chs, ok := b.segChans[key]
	if !ok {
		chs = []chan *Seg{}
		b.segChans[key] = chs
	}
	ch := make(chan *Seg)
	chs = append(chs, ch)
	b.segChans[key] = chs
	spmetrics.SegmentSubscriptionsOpen.WithLabelValues(user, rendition).Set(float64(len(chs)))
	return ch
}

func (b *Bus) UnsubscribeSegment(ctx context.Context, user string, rendition string, ch <-chan *Seg) {
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
	chs, ok := b.segChans[key]
	if !ok {
		return
	}
	for _, ch := range chs {
		go func(ch chan *Seg) {
			select {
			case ch <- seg:
			case <-ctx.Done():
				return
			case <-time.After(1 * time.Minute):
				log.Warn(ctx, "failed to send segment to channel, timing out", "user", user, "rendition", rendition)
			}

		}(ch)
	}
}
