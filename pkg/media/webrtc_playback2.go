package media

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/spmetrics"
)

// we have a bug that prevents us from correctly probing video durations
// a lot of the time. so when we don't have them we use the last duration
// that we had, and when we don't have that we use a default duration
var DefaultDuration2 = time.Duration(32 * time.Millisecond)

// This function remains in scope for the duration of a single users' playback
func (mm *MediaManager) WebRTCPlayback2(ctx context.Context, user string, rendition string, offer *webrtc.SessionDescription) (*webrtc.SessionDescription, error) {
	uu, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	ctx = log.WithLogValues(ctx, "webrtcID", uu.String())
	ctx = log.WithLogValues(ctx, "mediafunc", "WebRTCPlayback")

	// Create a new RTCPeerConnection
	peerConnection, err := mm.webrtcAPI.NewPeerConnection(mm.webrtcConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create WebRTC peer connection: %w", err)
	}

	videoTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeH264}, "video", "pion")
	if err != nil {
		return nil, fmt.Errorf("failed to create video track: %w", err)
	}
	videoRTPSender, err := peerConnection.AddTrack(videoTrack)
	if err != nil {
		return nil, fmt.Errorf("failed to add video track to peer connection: %w", err)
	}

	audioTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus}, "audio", "pion")
	if err != nil {
		return nil, fmt.Errorf("failed to create audio track: %w", err)
	}
	audioRTPSender, err := peerConnection.AddTrack(audioTrack)
	if err != nil {
		return nil, fmt.Errorf("failed to add audio track to peer connection: %w", err)
	}

	// Set the remote SessionDescription
	if err = peerConnection.SetRemoteDescription(*offer); err != nil {
		return nil, fmt.Errorf("failed to set remote description: %w", err)
	}

	// Create answer
	answer, err := peerConnection.CreateAnswer(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create answer: %w", err)
	}

	// Sets the LocalDescription, and starts our UDP listeners
	if err = peerConnection.SetLocalDescription(answer); err != nil {
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}

	// Create channel that is blocked until ICE Gathering is complete
	gatherComplete := webrtc.GatheringCompletePromise(peerConnection)

	// Setup complete! Now we boot up streaming in the background while returning the SDP offer to the user.

	go func() {
		ctx, cancel := context.WithCancel(ctx)
		defer cancel()

		started := time.Now()
		elapsed := time.Duration(0)
		latency := time.Duration(0)

		go func() {
			for {
				select {
				case <-ctx.Done():
					return
				case <-time.After(time.Second * 5):
					log.Log(ctx, "check elapsed", "elapsed", elapsed, "duration", time.Since(started))
				}
			}
		}()

		packetQueue := make(chan *PacketizedSegment, 1024)
		go func() {
			ch := mm.SubscribeSegment(ctx, user, rendition)
			defer mm.UnsubscribeSegment(ctx, user, rendition, ch)
			for {
				select {
				case <-ctx.Done():
					log.Debug(ctx, "exiting segment reader")
					return
				case file := <-ch:
					log.Debug(ctx, "got segment", "file", file.Filepath)
					packet, err := Packetize(ctx, file)
					if err != nil {
						log.Error(ctx, "failed to packetize segment", "error", err)
						continue
					}
					latency += packet.Duration
					packetQueue <- packet
				}
			}
		}()

		go func() {
			go func() {
				<-ctx.Done()
				if cErr := peerConnection.Close(); cErr != nil {
					log.Log(ctx, "cannot close peerConnection: %v\n", cErr)
				}
			}()

			lastPacketTime := time.Now()

			p1 := <-packetQueue
			p2 := <-packetQueue
			bufPacketQueue := make(chan *PacketizedSegment, 1024)
			go func() {
				bufPacketQueue <- p1
				bufPacketQueue <- p2
				for {
					select {
					case <-ctx.Done():
						return
					case packet := <-packetQueue:
						bufPacketQueue <- packet
					}
				}
			}()

			var scalar float64 = 1

			for {
				select {
				case <-ctx.Done():
					return
				case packet := <-bufPacketQueue:
					latency -= packet.Duration
					scalar = getPlaybackRate(latency)
					log.Warn(ctx, "latency", "latency", latency, "scalar", scalar)
					var videoDur time.Duration
					var audioDur time.Duration
					if len(packet.Video) > 0 {
						videoDur = packet.Duration / time.Duration(len(packet.Video))
					}
					if len(packet.Audio) > 0 {
						audioDur = packet.Duration / time.Duration(len(packet.Audio))
					}
					g, _ := errgroup.WithContext(ctx)

					if videoDur > 0 {
						g.Go(func() error {
							ticker := time.NewTicker(time.Duration(float64(videoDur) * (1 / scalar)))
							defer ticker.Stop()
							for _, video := range packet.Video {
								// log.Log(ctx, "writing video sample", "duration", videoDur)
								err := videoTrack.WriteSample(media.Sample{Data: video, Duration: videoDur})
								if err != nil {
									return fmt.Errorf("failed to write video sample: %w", err)
								}

								select {
								case <-ctx.Done():
									return nil
								case <-ticker.C:
									continue
								}
							}
							return nil
						})
					} else {
						log.Warn(ctx, "no video samples to write")
					}
					if audioDur > 0 {
						g.Go(func() error {
							ticker := time.NewTicker(time.Duration(float64(audioDur) * (1 / scalar)))
							defer ticker.Stop()
							log.Log(ctx, "time since last packet", "time", time.Since(lastPacketTime))
							for _, audio := range packet.Audio {
								err := audioTrack.WriteSample(media.Sample{Data: audio, Duration: audioDur})
								if err != nil {
									return fmt.Errorf("failed to write audio sample: %w", err)
								}
								select {
								case <-ctx.Done():
									return nil
								case <-ticker.C:
									continue
								}
							}
							lastPacketTime = time.Now()
							return nil
						})

						if err := g.Wait(); err != nil {
							log.Error(ctx, "failed to write samples", "error", err)
							cancel()
						}
					} else {
						log.Warn(ctx, "no audio samples to write")
					}
				}
			}
		}()

		spmetrics.ViewerInc(user)
		defer spmetrics.ViewerDec(user)

		go func() {
			rtcpBuf := make([]byte, 1500)
			for {
				if _, _, rtcpErr := videoRTPSender.Read(rtcpBuf); rtcpErr != nil {
					return
				}
			}
		}()

		go func() {
			rtcpBuf := make([]byte, 1500)
			for {
				if _, _, rtcpErr := audioRTPSender.Read(rtcpBuf); rtcpErr != nil {
					return
				}
			}
		}()

		// Set the handler for ICE connection state
		// This will notify you when the peer has connected/disconnected
		peerConnection.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
			log.Log(ctx, "Connection State has changed", "state", connectionState.String())
		})

		// Set the handler for Peer connection state
		// This will notify you when the peer has connected/disconnected
		peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
			log.Log(ctx, "Peer Connection State has changed", "state", s.String())

			if s == webrtc.PeerConnectionStateFailed || s == webrtc.PeerConnectionStateClosed || s == webrtc.PeerConnectionStateDisconnected {
				// Wait until PeerConnection has had no network activity for 30 seconds or another failure. It may be reconnected using an ICE Restart.
				// Use webrtc.PeerConnectionStateDisconnected if you are interested in detecting faster timeout.
				// Note that the PeerConnection may come back from PeerConnectionStateDisconnected.
				log.Log(ctx, "Peer Connection has gone to failed, exiting")
				cancel()
			}
		})

		<-ctx.Done()

		log.Warn(ctx, "exiting playback")

	}()
	select {
	case <-gatherComplete:
		return peerConnection.LocalDescription(), nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// getPlaybackRate returns a playback rate that eases from 1.0 to 1.5 between 7 and 60 seconds
func getPlaybackRate(dur time.Duration) float64 {
	switch {
	case dur <= 7*time.Second:
		return 1.0
	case dur >= 60*time.Second:
		return 1.5
	default:
		// Linear interpolation between (7,1.0) and (60,1.5)
		progress := (float64(dur) - float64(7*time.Second)) / (float64(60*time.Second) - float64(7*time.Second))
		return 1.0 + (0.5 * progress)
	}
}
