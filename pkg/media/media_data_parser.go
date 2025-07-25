package media

import (
	"bytes"
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/go-gst/go-gst/gst"
	"github.com/go-gst/go-gst/gst/app"
	"go.opentelemetry.io/otel"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/model"
)

func ParseSegmentMediaData(ctx context.Context, mp4bs []byte) (*model.SegmentMediaData, error) {
	ctx, span := otel.Tracer("signer").Start(ctx, "ParseSegmentMediaData")
	defer span.End()
	ctx = log.WithLogValues(ctx, "GStreamerFunc", "ParseSegmentMediaData")
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	pipelineSlice := []string{
		"appsrc name=appsrc ! qtdemux name=demux",
		"demux.video_0 ! queue ! h264parse name=videoparse disable-passthrough=true config-interval=-1 ! h264timestamper ! appsink sync=false name=videoappsink",
		"demux.audio_0 ! queue ! opusparse name=audioparse ! appsink sync=false name=audioappsink",
	}

	pipeline, err := gst.NewPipelineFromString(strings.Join(pipelineSlice, "\n"))
	if err != nil {
		return nil, fmt.Errorf("error creating SegmentMetadata pipeline: %w", err)
	}

	var videoMetadata *model.SegmentMediadataVideo
	var audioMetadata *model.SegmentMediadataAudio

	appsrc, err := pipeline.GetElementByName("appsrc")
	if err != nil {
		return nil, fmt.Errorf("error creating SegmentMetadata pipeline: %w", err)
	}

	src := app.SrcFromElement(appsrc)
	src.SetCallbacks(&app.SourceCallbacks{
		NeedDataFunc: ReaderNeedData(ctx, bytes.NewReader(mp4bs)),
	})

	onPadAdded := func(element *gst.Element, pad *gst.Pad) {
		caps := pad.GetCurrentCaps()
		if caps == nil {
			log.Warn(ctx, "Unable to get pad caps")
			cancel()
			return
		}

		structure := caps.GetStructureAt(0)
		if structure == nil {
			log.Warn(ctx, "Unable to get structure from caps")
			cancel()
			return
		}

		name := structure.Name()

		if name[:5] == "video" {
			videoMetadata = &model.SegmentMediadataVideo{}
			// Get some common video properties
			widthVal, _ := structure.GetValue("width")
			heightVal, _ := structure.GetValue("height")

			width, ok := widthVal.(int)
			if ok {
				videoMetadata.Width = width
			}
			height, ok := heightVal.(int)
			if ok {
				videoMetadata.Height = height
			}
			framerateVal, _ := structure.GetValue("framerate")
			framerateStr := fmt.Sprintf("%v", framerateVal)
			parts := strings.Split(framerateStr, "/")
			num := 0
			den := 0
			if len(parts) == 2 {
				num, _ = strconv.Atoi(parts[0])
				den, _ = strconv.Atoi(parts[1])
			}
			if num != 0 && den != 0 {
				videoMetadata.FPSNum = num
				videoMetadata.FPSDen = den
			}
		}

		if name[:5] == "audio" {
			audioMetadata = &model.SegmentMediadataAudio{}
			// Get some common audio properties
			rateVal, _ := structure.GetValue("rate")
			channelsVal, _ := structure.GetValue("channels")

			rate, ok := rateVal.(int)
			if ok {
				audioMetadata.Rate = rate
			}
			channels, ok := channelsVal.(int)
			if ok {
				audioMetadata.Channels = channels
			}
		}

		// if videoMetadata != nil && audioMetadata != nil {
		// 	cancel()
		// }
	}

	demux, err := pipeline.GetElementByName("demux")
	if err != nil {
		return nil, fmt.Errorf("error creating SegmentMetadata pipeline: %w", err)
	}
	_, err = demux.Connect("pad-added", onPadAdded)
	if err != nil {
		return nil, fmt.Errorf("error connecting pad-add: %w", err)
	}

	audioSinkElem, err := pipeline.GetElementByName("audioappsink")
	if err != nil {
		return nil, fmt.Errorf("failed to get audioappsink element: %w", err)
	}
	audioSink := app.SinkFromElement(audioSinkElem)
	if audioSink == nil {
		return nil, fmt.Errorf("failed to get audioappsink element: %w", err)
	}

	audioSink.SetCallbacks(&app.SinkCallbacks{
		NewSampleFunc: func(sink *app.Sink) gst.FlowReturn {
			sample := sink.PullSample()
			if sample == nil {
				return gst.FlowOK
			}

			return gst.FlowOK
		},
	})

	videoSinkElem, err := pipeline.GetElementByName("videoappsink")
	if err != nil {
		return nil, fmt.Errorf("failed to get videoappsink element: %w", err)
	}
	videoSink := app.SinkFromElement(videoSinkElem)
	if videoSink == nil {
		return nil, fmt.Errorf("failed to get videoappsink element: %w", err)
	}

	hasBFrames := false
	videoSink.SetCallbacks(&app.SinkCallbacks{
		NewSampleFunc: func(sink *app.Sink) gst.FlowReturn {
			sample := sink.PullSample()
			if sample == nil {
				return gst.FlowOK
			}

			buf := sample.GetBuffer()
			pts := buf.PresentationTimestamp().String()
			dts := buf.DecodingTimestamp().String()

			if pts != dts {
				hasBFrames = true
			} else {
				log.Log(ctx, "no bframes", "pts", pts, "dts", dts)
			}

			return gst.FlowOK
		},
	})

	go func() {
		if err := HandleBusMessages(ctx, pipeline); err != nil {
			log.Log(ctx, "pipeline error", "error", err)
		}
		cancel()
	}()

	// Start the pipeline
	if err := pipeline.SetState(gst.StatePlaying); err != nil {
		return nil, err
	}

	defer func() {
		if err := pipeline.BlockSetState(gst.StateNull); err != nil {
			log.Error(ctx, "error setting pipeline state to null", "error", err)
		}
	}()

	<-ctx.Done()

	if videoMetadata == nil {
		return nil, fmt.Errorf("no video metadata")
	}
	if audioMetadata == nil {
		return nil, fmt.Errorf("no audio metadata")
	}

	videoMetadata.BFrames = hasBFrames

	meta := &model.SegmentMediaData{
		Video: []*model.SegmentMediadataVideo{videoMetadata},
		Audio: []*model.SegmentMediadataAudio{audioMetadata},
	}

	ok, dur := pipeline.QueryDuration(gst.FormatTime)
	if !ok {
		return nil, fmt.Errorf("error getting duration")
	} else {
		meta.Duration = dur
	}

	return meta, nil
}
