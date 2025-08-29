package statedb

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/bluesky-social/indigo/api/bsky"
	"gorm.io/gorm"
	"stream.place/streamplace/pkg/integrations/discord"
	"stream.place/streamplace/pkg/log"
	notificationpkg "stream.place/streamplace/pkg/notifications"
	"stream.place/streamplace/pkg/streamplace"
)

var TaskNotification = "notification"

type NotificationTask struct {
	Livestream  *streamplace.Livestream_LivestreamView
	FeedPost    *bsky.FeedDefs_PostView
	ChatProfile *streamplace.ChatProfile
	PDSURL      string
}

func (state *StatefulDB) ProcessQueue(ctx context.Context) error {
	for {
		task, err := state.DequeueTask(ctx, "queue_processor")
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if task != nil {
			err := state.processTask(ctx, task)
			if err != nil {
				log.Error(ctx, "failed to process task", "err", err)
			}
		} else {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(1 * time.Second):
				continue
			}
		}

	}
}

func (state *StatefulDB) processTask(ctx context.Context, task *AppTask) error {
	switch task.Type {
	case TaskNotification:
		return state.processNotificationTask(ctx, task)
	default:
		return fmt.Errorf("unknown task type: %s", task.Type)
	}
}

func (state *StatefulDB) processNotificationTask(ctx context.Context, task *AppTask) error {
	var notificationTask NotificationTask
	if err := json.Unmarshal(task.Payload, &notificationTask); err != nil {
		return err
	}
	lsv := notificationTask.Livestream
	rec, ok := lsv.Record.Val.(*streamplace.Livestream)
	if !ok {
		return fmt.Errorf("invalid livestream record")
	}
	userDID := lsv.Author.Did

	log.Warn(ctx, "Livestream detected! Blasting followers!", "title", rec.Title, "url", rec.Url, "createdAt", rec.CreatedAt, "repo", userDID)
	notifications, err := state.GetFollowersNotificationTokens(userDID)
	if err != nil {
		return err
	}

	nb := &notificationpkg.NotificationBlast{
		Title: fmt.Sprintf("🔴 @%s is LIVE!", lsv.Author.Handle),
		Body:  rec.Title,
		Data: map[string]string{
			"path": fmt.Sprintf("/%s", lsv.Author.Handle),
		},
	}
	if state.noter != nil {
		err := state.noter.Blast(ctx, notifications, nb)
		if err != nil {
			log.Error(ctx, "failed to blast notifications", "err", err)
		} else {
			log.Log(ctx, "sent notifications", "user", userDID, "count", len(notifications), "content", nb)
		}
	} else {
		log.Log(ctx, "no notifier configured, skipping notifications", "user", userDID, "count", len(notifications), "content", nb)
	}

	for _, webhook := range state.CLI.DiscordWebhooks {
		if webhook.DID == userDID && webhook.Type == "livestream" {
			go func() {
				err := discord.SendLivestream(ctx, webhook, notificationTask.PDSURL, lsv, notificationTask.FeedPost, notificationTask.ChatProfile)
				if err != nil {
					log.Error(ctx, "failed to send livestream to discord", "err", err)
				} else {
					log.Log(ctx, "sent livestream to discord", "user", userDID, "webhook", webhook.URL)
				}
			}()
		}
	}
	return nil
}
