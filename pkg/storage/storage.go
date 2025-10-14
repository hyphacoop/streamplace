package storage

import (
	"context"
	"fmt"
	"os"
	"time"

	"golang.org/x/sync/errgroup"
	"stream.place/streamplace/pkg/aqtime"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/model"
)

func StartSegmentCleaner(ctx context.Context, mod model.Model, cli *config.CLI) error {
	g, ctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		for {
			select {
			case <-ctx.Done():
				return nil
			case <-time.After(10 * time.Second):
				expiredSegments, err := mod.GetExpiredSegments(ctx)
				if err != nil {
					return err
				}
				log.Log(ctx, "Cleaning expired segments", "count", len(expiredSegments))
				for _, seg := range expiredSegments {
					g.Go(func() error {
						err := deleteSegment(ctx, mod, cli, seg)
						if err != nil {
							log.Error(ctx, "Failed to delete segment", "error", err)
						}
						return nil
					})

				}
			}
		}
	})

	return g.Wait()
}

func deleteSegment(ctx context.Context, mod model.Model, cli *config.CLI, seg model.Segment) error {
	aqt := aqtime.FromTime(seg.StartTime)
	fpath, err := cli.SegmentFilePath(seg.RepoDID, fmt.Sprintf("%s.%s", aqt.FileSafeString(), "mp4"))
	if err != nil {
		return err
	}
	err = os.Remove(fpath)
	if err != nil {
		return err
	}
	err = mod.DeleteSegment(ctx, seg.ID)
	if err != nil {
		return err
	}
	return nil
}
