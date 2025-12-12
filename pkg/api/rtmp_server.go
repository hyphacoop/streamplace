// Package main contains an example.
package api

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/bluenviron/gortmplib"
	"github.com/bluenviron/gortsplib/v5/pkg/format"
	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/media"
)

// This example shows how to:
// 1. create a RTMP server
// 2. accept a stream from a reader.
// 3. broadcast the stream to readers.

// var (
// 	mutex     sync.Mutex
// 	publisher *gortmplib.ServerConn
// 	tracks    []format.Format
// 	readers   []*gortmplib.Writer
// )

const RTMPPrefix = "/live/"

func (a *StreamplaceAPI) HandleRTMPPublisher(ctx context.Context, sc *gortmplib.ServerConn) error {
	sc.RW.(net.Conn).SetReadDeadline(time.Now().Add(10 * time.Second))

	if !strings.HasPrefix(sc.URL.Path, RTMPPrefix) {
		return fmt.Errorf("RTMP publisher is not allowed to publish to %s (must start with %s)", sc.URL.String(), RTMPPrefix)
	}
	streamKey := strings.TrimPrefix(sc.URL.Path, RTMPPrefix)
	mediaSigner, err := a.MakeMediaSigner(ctx, streamKey)
	if err != nil {
		return fmt.Errorf("failed to make media signer: %w", err)
	}

	ctx = log.WithLogValues(ctx, "streamer", mediaSigner.Streamer())

	videoInput := make(chan *media.RTMPH264Data, 1024)
	defer close(videoInput)
	audioInput := make(chan *media.RTMPAACData, 1024)
	defer close(audioInput)

	r := &gortmplib.Reader{
		Conn: sc,
	}
	err = r.Initialize()
	if err != nil {
		return err
	}

	for _, track := range r.Tracks() {
		log.Log(ctx, "get track", "track", track)

		switch track := track.(type) {
		case *format.H264:
			r.OnDataH264(track, func(pts time.Duration, dts time.Duration, au [][]byte) {
				log.Log(ctx, "got H264", "len", len(au), "pts", pts, "dts", dts)
				videoInput <- &media.RTMPH264Data{
					AU:  au,
					PTS: pts,
				}
			})

		case *format.MPEG4Audio:
			r.OnDataMPEG4Audio(track, func(pts time.Duration, au []byte) {
				log.Log(ctx, "got MPEG4Au", "len", len(au), "pts", pts)
				audioInput <- &media.RTMPAACData{
					AU:  au,
					PTS: pts,
				}
			})

		default:
			return fmt.Errorf("unsupported track type: %T", track)
		}
	}

	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		for {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			sc.RW.(net.Conn).SetReadDeadline(time.Now().Add(10 * time.Second))
			err = r.Read()
			if err != nil {
				return err
			}
		}
	})

	g.Go(func() error {
		return a.MediaManager.RTMPIngest(ctx, videoInput, audioInput, mediaSigner)
	})

	return g.Wait()
}

func (a *StreamplaceAPI) HandleRTMPConnInner(ctx context.Context, conn net.Conn) error {
	conn.SetReadDeadline(time.Now().Add(10 * time.Second))

	sc := &gortmplib.ServerConn{
		RW: conn,
	}
	err := sc.Initialize()
	if err != nil {
		return err
	}

	err = sc.Accept()
	if err != nil {
		return err
	}

	if sc.Publish {
		return a.HandleRTMPPublisher(ctx, sc)
	}
	return fmt.Errorf("RTMP playback is not supported")
}

func (a *StreamplaceAPI) HandleRTMPConn(ctx context.Context, conn net.Conn) {
	defer conn.Close()

	log.Log(ctx, "connection opened", "remoteAddr", conn.RemoteAddr())
	err := a.HandleRTMPConnInner(ctx, conn)
	log.Log(ctx, "connection closed", "remoteAddr", conn.RemoteAddr(), "error", err)
}

func (a *StreamplaceAPI) StartRTMPServer(ctx context.Context) error {
	ln, err := net.Listen("tcp", ":1935")
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}
	defer ln.Close()

	log.Log(ctx, "listening on :1935")

	// Accept loop in a goroutine so we can select on context.Done
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				log.Error(ctx, "error accepting RTMP connection", "error", err)
			}

			go a.HandleRTMPConn(ctx, conn)
		}
	}()

	<-ctx.Done()

	return ln.Close()
}
