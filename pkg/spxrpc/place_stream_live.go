package spxrpc

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/bluesky-social/indigo/lex/util"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/spid"
	"stream.place/streamplace/pkg/spmetrics"

	placestreamtypes "stream.place/streamplace/pkg/streamplace"
)

var replicationUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024 * 1024 * 10, // 10MB
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (s *Server) handlePlaceStreamLiveGetSegments(ctx context.Context, before string, limit int, userDID string) (*placestreamtypes.LiveGetSegments_Output, error) {
	if userDID == "" {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "User DID is required")
	}
	var beforeTime *time.Time
	if before != "" {
		parsedTime, err := time.Parse(time.RFC3339, before)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid 'before' parameter: must be RFC3339 format")
		}
		beforeTime = &parsedTime
	}

	segments, err := s.model.LatestSegmentsForUser(userDID, limit, beforeTime, nil)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch segments")
	}

	// Convert segments to the expected output format
	output := &placestreamtypes.LiveGetSegments_Output{
		Segments: make([]*placestreamtypes.Segment_SegmentView, len(segments)),
	}

	for i, segment := range segments {
		record, err := segment.ToStreamplaceSegment()
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to convert segment to streamplace segment: %s", err))
		}
		c, err := spid.GetCID(record)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to get CID: %s", err))
		}
		ltd := &util.LexiconTypeDecoder{Val: record}

		output.Segments[i] = &placestreamtypes.Segment_SegmentView{
			Record: ltd,
			Cid:    c.String(),
		}
	}

	return output, nil
}

func (s *Server) handlePlaceStreamLiveGetLiveUsers(ctx context.Context, before string, limit int) (*placestreamtypes.LiveGetLiveUsers_Output, error) {
	var beforeTime *time.Time
	if before != "" {
		parsedTime, err := time.Parse(time.RFC3339, before)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid 'before' parameter: must be RFC3339 format")
		}
		beforeTime = &parsedTime
	}
	ls, err := s.model.GetLatestLivestreams(limit, beforeTime)
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch livestreams")
	}

	streams := make([]*placestreamtypes.Livestream_LivestreamView, len(ls))

	for i, l := range ls {
		stream, err := l.ToLivestreamView()
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("Failed to convert livestream to streamplace livestream: %s", err))
		}
		viewers := spmetrics.GetViewCount(stream.Author.Did)
		stream.ViewerCount = &placestreamtypes.Livestream_ViewerCount{
			LexiconTypeID: "place.stream.livestream#viewerCount",
			Count:         int64(viewers),
		}
		streams[i] = stream
	}

	liveUsers := &placestreamtypes.LiveGetLiveUsers_Output{
		Streams: streams,
	}

	return liveUsers, nil
}

func (s *Server) handlePlaceStreamLiveSubscribeSegments(c echo.Context) error {
	user := c.QueryParam("streamer")
	if user == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "User DID is required")
	}
	spmetrics.ReplicationWebsocketsOpen.Inc()
	defer spmetrics.ReplicationWebsocketsOpen.Dec()
	ws, err := replicationUpgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer ws.Close()

	ctx, cancel := context.WithCancel(c.Request().Context())
	defer cancel()
	go func() {

		segChan := s.bus.SubscribeSegmentBuf(ctx, user, "source", 2)
		defer s.bus.UnsubscribeSegment(ctx, user, "source", segChan)
		for {
			select {
			case <-ctx.Done():
				log.Debug(ctx, "exiting segment reader")
				return
			case file := <-segChan.C:
				log.Debug(ctx, "got segment", "file", file.Filepath)
				err := ws.WriteMessage(websocket.BinaryMessage, file.Data)
				if err != nil {
					log.Error(ctx, "could not write message", "error", err)
					cancel()
					return
				}
			}
		}

	}()

	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		// Read
		_, msg, err := ws.ReadMessage()
		if err != nil {
			c.Logger().Error(err)
			return err
		}
		log.Debug(c.Request().Context(), "received message", "message", string(msg))
	}
}
