package media

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/bluenviron/mediacommon/v2/pkg/codecs/h264"
	"github.com/go-gst/go-gst/gst"
	"github.com/go-gst/go-gst/gst/app"
	"stream.place/streamplace/pkg/log"
)

type RTMPH264Data struct {
	AU  [][]byte
	PTS time.Duration
}

type RTMPAACData struct {
	AU  []byte
	PTS time.Duration
}

// ingest a H264+AAC RTMP stream
func (mm *MediaManager) RTMPIngest(ctx context.Context, videoInput chan *RTMPH264Data, audioInput chan *RTMPAACData, ms MediaSigner) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	pipelineSlice := []string{
		"appsrc name=videosrc ! queue ! h264parse name=parse",
		"appsrc name=audiosrc ! queue ! fdkaacdec ! audioresample ! opusenc name=audioenc",
	}
	pipeline, err := gst.NewPipelineFromString(strings.Join(pipelineSlice, "\n"))
	if err != nil {
		return fmt.Errorf("error creating RTMPIngest pipeline: %w", err)
	}

	videosrcEle, err := pipeline.GetElementByName("videosrc")
	if err != nil {
		return err
	}
	// defer runtime.KeepAlive(srcele)
	videosrc := app.SrcFromElement(videosrcEle)
	videosrc.SetCaps(gst.NewCapsFromString("video/x-h264,stream-format=byte-stream"))
	videosrc.SetCallbacks(&app.SourceCallbacks{
		NeedDataFunc: func(self *app.Source, length uint) {
			if ctx.Err() != nil {
				self.EndStream()
				return
			}

			packet := <-videoInput
			if packet == nil {
				log.Debug(ctx, "video input closed, ending stream")
				self.EndStream()
				return
			}

			// allBytes := bytes.Buffer{}
			// for _, au := range packet.AU {
			// 	allBytes.Write(au)
			// }

			avcc, err := h264.AnnexB(packet.AU).Marshal()
			if err != nil {
				log.Error(ctx, "failed to marshal AVCC", "error", err)
				self.Error("failed to marshal AVCC", fmt.Errorf("failed to marshal AVCC: %w", err))
				return
			}

			buf := gst.NewBufferFromBytes(avcc)
			buf.SetPresentationTimestamp(gst.ClockTime(uint64(packet.PTS.Nanoseconds())))
			ret := self.PushBuffer(buf)
			if ret != gst.FlowOK {
				log.Error(ctx, "failed to push video buffer", "error", ret.String())
				self.Error("failed to push video buffer", fmt.Errorf("failed to push video buffer: %s", ret.String()))
				return
			}
		},
	})

	audiosrcEle, err := pipeline.GetElementByName("videosrc")
	if err != nil {
		return err
	}
	// defer runtime.KeepAlive(srcele)
	audiosrc := app.SrcFromElement(audiosrcEle)
	audiosrc.SetCallbacks(&app.SourceCallbacks{
		NeedDataFunc: func(self *app.Source, length uint) {
			if ctx.Err() != nil {
				self.EndStream()
				return
			}
			packet := <-audioInput
			if packet == nil {
				log.Debug(ctx, "audio input closed, ending stream")
				self.EndStream()
				return
			}
			buf := gst.NewBufferFromBytes(packet.AU)
			buf.SetPresentationTimestamp(gst.ClockTime(uint64(packet.PTS.Nanoseconds())))
			ret := self.PushBuffer(buf)
			if ret != gst.FlowOK {
				log.Error(ctx, "failed to push audio buffer", "error", ret.String())
				self.Error("failed to push audio buffer", fmt.Errorf("failed to push audio buffer: %s", ret.String()))
				return
			}
		},
	})

	parseEle, err := pipeline.GetElementByName("parse")
	if err != nil {
		return err
	}

	signer, err := mm.SegmentAndSignElem(ctx, ms)
	if err != nil {
		return err
	}

	err = pipeline.Add(signer)
	if err != nil {
		return err
	}
	err = parseEle.Link(signer)
	if err != nil {
		return err
	}
	audioenc, err := pipeline.GetElementByName("audioenc")
	if err != nil {
		return err
	}
	err = audioenc.Link(signer)
	if err != nil {
		return err
	}

	busErr := make(chan error)
	go func() {
		err := HandleBusMessages(ctx, pipeline)
		busErr <- err
	}()

	go mm.HandleKeyRevocation(ctx, ms, pipeline)

	err = pipeline.SetState(gst.StatePlaying)
	if err != nil {
		return err
	}

	defer func() {
		err := pipeline.SetState(gst.StateNull)
		if err != nil {
			log.Error(ctx, "error setting pipeline to null state", "error", err)
		}
	}()

	err = <-busErr

	return err
}
