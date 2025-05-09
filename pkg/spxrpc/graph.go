package spxrpc

import (
	"context"
	"fmt"

	"github.com/bluesky-social/indigo/api/atproto"
	"go.opentelemetry.io/otel"
	"stream.place/streamplace/pkg/log"
	placestreamtypes "stream.place/streamplace/pkg/streamplace"
)

func (s *Server) handlePlaceStreamGraphGetFollowingUser(ctx context.Context, userDID string, subjectDID string) (*placestreamtypes.GraphGetFollowingUser_Output, error) {
	ctx, span := otel.Tracer("server").Start(ctx, "handlePlaceStreamGraphGetFollowingUser")
	defer span.End()

	if userDID == "" || !isValidDID(userDID) {
		log.Error(ctx, "Missing or invalid user DID")
		return &placestreamtypes.GraphGetFollowingUser_Output{}, nil
	}

	follows, err := s.model.GetUserFollowing(ctx, userDID)
	if err != nil {
		log.Error(ctx, "Failed to get user following", "error", err)
		return &placestreamtypes.GraphGetFollowingUser_Output{}, nil
	}

	for _, follow := range follows {
		if follow.SubjectDID == subjectDID {
			// User is following the subject, return the follow reference
			return &placestreamtypes.GraphGetFollowingUser_Output{
				Follow: &atproto.RepoStrongRef{
					Cid: "", // We don't store CID in our model
					Uri: fmt.Sprintf("at://%s/app.bsky.graph.follow/%s", userDID, follow.RKey),
				},
			}, nil
		}
	}

	// User is not following the subject
	return &placestreamtypes.GraphGetFollowingUser_Output{}, nil
}

func isValidDID(did string) bool {
	return len(did) > 0 && (did[:7] == "did:plc" || did[:7] == "did:web")
}
