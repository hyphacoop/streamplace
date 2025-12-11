// Package main contains an example.
package media

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/bluenviron/gortmplib"
	"github.com/bluenviron/gortsplib/v5/pkg/format"
	"stream.place/streamplace/pkg/log"
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

func handlePublisher(ctx context.Context, sc *gortmplib.ServerConn) error {
	sc.RW.(net.Conn).SetReadDeadline(time.Now().Add(10 * time.Second))

	r := &gortmplib.Reader{
		Conn: sc,
	}
	err := r.Initialize()
	if err != nil {
		return err
	}

	log.Log(ctx, "conn %v is publishing:", sc.RW.(net.Conn).RemoteAddr())

	for _, track := range r.Tracks() {
		log.Log(ctx, "get track", "track", track)

		switch track := track.(type) {
		case *format.AV1:
			r.OnDataAV1(track, func(pts time.Duration, tu [][]byte) {
				log.Log(ctx, "got AV1", "len", len(tu), "pts", pts)
			})

		case *format.VP9:
			r.OnDataVP9(track, func(pts time.Duration, frame []byte) {

				log.Log(ctx, "got VP9", "len", len(frame), "pts", pts)
			})

		case *format.H265:
			r.OnDataH265(track, func(pts time.Duration, dts time.Duration, au [][]byte) {
				log.Log(ctx, "got H265", "len", len(au), "pts", pts, "dts", dts)
			})

		case *format.H264:
			r.OnDataH264(track, func(pts time.Duration, dts time.Duration, au [][]byte) {
				log.Log(ctx, "got H264", "len", len(au), "pts", pts, "dts", dts)
			})

		case *format.Opus:
			r.OnDataOpus(track, func(pts time.Duration, packet []byte) {
				log.Log(ctx, "got Opus", "len", len(packet), "pts", pts)
			})

		case *format.MPEG4Audio:
			r.OnDataMPEG4Audio(track, func(pts time.Duration, au []byte) {
				log.Log(ctx, "got MPEG4Au", "len", len(au), "pts", pts)
			})

		case *format.MPEG1Audio:
			r.OnDataMPEG1Audio(track, func(pts time.Duration, frame []byte) {
				log.Log(ctx, "got MPEG1Au", "len", len(frame), "pts", pts)
			})

		case *format.AC3:
			r.OnDataAC3(track, func(pts time.Duration, frame []byte) {
				log.Log(ctx, "got AC3", "len", len(frame), "pts", pts)
			})

		case *format.G711:
			r.OnDataG711(track, func(pts time.Duration, samples []byte) {
				log.Log(ctx, "got G711", "len", len(samples), "pts", pts)
			})

		case *format.LPCM:
			r.OnDataLPCM(track, func(pts time.Duration, samples []byte) {
				log.Log(ctx, "got LPCM", "len", len(samples), "pts", pts)
			})
		}
	}

	for {
		sc.RW.(net.Conn).SetReadDeadline(time.Now().Add(10 * time.Second))
		err = r.Read()
		if err != nil {
			return err
		}
	}
}

func handleConnInner(ctx context.Context, conn net.Conn) error {
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
		return handlePublisher(ctx, sc)
	}
	return fmt.Errorf("RTMP playback is not supported")
}

func handleConn(ctx context.Context, conn net.Conn) {
	defer conn.Close()

	log.Log(ctx, "conn %v opened", conn.RemoteAddr())
	err := handleConnInner(ctx, conn)
	log.Log(ctx, "conn %v closed: %v", conn.RemoteAddr(), err)
}

func StartRTMPServer(ctx context.Context) error {
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

			go handleConn(ctx, conn)
		}
	}()

	<-ctx.Done()

	return ln.Close()
}
