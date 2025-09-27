package spxrpc

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	comatprototypes "github.com/bluesky-social/indigo/api/atproto"
	lexutil "github.com/bluesky-social/indigo/lex/util"

	"github.com/bluesky-social/indigo/xrpc"
	"github.com/ipfs/go-cid"
	"github.com/labstack/echo/v4"
	"github.com/streamplace/oatproxy/pkg/oatproxy"
	"go.opentelemetry.io/otel"
	"stream.place/streamplace/pkg/atproto"
	"stream.place/streamplace/pkg/log"
)

func resolveRepoService(ctx context.Context, repo string) (string, string, string, error) {
	did := repo
	var err error
	if !strings.HasPrefix(repo, "did:") {
		did, err = oatproxy.ResolveHandle(ctx, repo)
		if err != nil {
			return "", "", "", fmt.Errorf("failed to resolve handle %q: %w", repo, err)
		}
	}

	service, handle, err := oatproxy.ResolveService(ctx, did)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to resolve service for did %q: %w", did, err)
	}

	return did, service, handle, nil
}

var maxBlobSize int64 = 1024 * 1024 * 10 // 10MB

func (s *Server) handleComAtprotoRepoUploadBlob(ctx context.Context, r io.Reader, contentType string) (*comatprototypes.RepoUploadBlob_Output, error) {
	ctx, span := otel.Tracer("server").Start(ctx, "handleComAtprotoRepoUploadBlob")
	defer span.End()

	session, client := oatproxy.GetOAuthSession(ctx)
	if session == nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "oauth session not found")
	}

	// we need to buffer the blob so we can successfully retry upon dpop nonce changes
	var err error
	buf := bytes.Buffer{}
	_, err = io.CopyN(&buf, r, maxBlobSize+1)
	if err == nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "blob size exceeds max size")
	}
	if !errors.Is(err, io.EOF) {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to copy reader to buffer")
	}

	var out comatprototypes.RepoUploadBlob_Output

	err = client.Do(ctx, xrpc.Procedure, contentType, "com.atproto.repo.uploadBlob", nil, bytes.NewReader(buf.Bytes()), &out)

	if err != nil {
		log.Error(ctx, "upstream xrpc error", "error", err)
		return nil, err
	}

	return &out, nil
}

func (s *Server) handleComAtprotoRepoDescribeRepo(ctx context.Context, repo string) (*comatprototypes.RepoDescribeRepo_Output, error) {
	did, svc, handle, err := resolveRepoService(ctx, repo)
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoDescribeRepo: %w", err)
	}

	// if the service isn't the current host, we proxy the request
	if svc != s.cli.PublicHost {
		var out comatprototypes.RepoDescribeRepo_Output
		params := make(map[string]interface{})
		params["repo"] = repo

		err = makeUnauthenticatedRequest(ctx, svc, "com.atproto.repo.describeRepo", params, &out)
		if err != nil {
			log.Error(ctx, "upstream xrpc error", "error", err)
			return nil, err
		}
		return &out, nil

	}

	return &comatprototypes.RepoDescribeRepo_Output{
		Handle: handle,
		Did:    did,
		DidDoc: atproto.DIDDoc(s.cli.PublicHost),
		Collections: []string{
			"com.atproto.lexicon.schema",
		},
		HandleIsCorrect: true,
	}, nil
}

func (s *Server) handleComAtprotoRepoListRecords(ctx context.Context, collection string, cursor string, limit int, repo string, reverse *bool) (*comatprototypes.RepoListRecords_Output, error) {
	_, svc, _, err := resolveRepoService(ctx, repo)
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoListRecords: %w", err)
	}
	// if the service isn't the current host, we proxy the request
	if svc != s.cli.PublicHost {
		var out comatprototypes.RepoListRecords_Output
		params := make(map[string]interface{})
		params["collection"] = collection
		if cursor != "" {
			params["cursor"] = cursor
		}
		if limit != 0 {
			params["limit"] = limit
		}
		if reverse != nil {
			params["reverse"] = *reverse
		}
		params["repo"] = repo

		err = makeUnauthenticatedRequest(ctx, svc, "com.atproto.repo.listRecords", params, &out)
		if err != nil {
			log.Error(ctx, "upstream xrpc error", "error", err)
			return nil, err
		}
		return &out, nil
	}

	r, ses, err := atproto.OpenLexiconRepo(ctx)
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoListRecords: failed to open repo: %w", err)
	}
	out := &comatprototypes.RepoListRecords_Output{
		Records: []*comatprototypes.RepoListRecords_Record{},
	}
	err = r.ForEach(ctx, "", func(rkey string, c cid.Cid) error {
		val, err := atproto.GetRecordCBOR(ctx, ses, c, collection, rkey)
		if err != nil {
			return fmt.Errorf("handleComAtprotoRepoListRecords: failed to get record for collection %q, rkey %q: %w", collection, rkey, err)
		}
		out.Records = append(out.Records, &comatprototypes.RepoListRecords_Record{
			Uri:   fmt.Sprintf("at://%s/%s/%s", repo, collection, rkey),
			Cid:   c.String(),
			Value: &lexutil.LexiconTypeDecoder{Val: val},
		})

		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoListRecords: error iterating records for collection %q: %w", collection, err)
	}
	return out, nil
}

func (s *Server) handleComAtprotoRepoGetRecord(ctx context.Context, c string, collection string, repo string, rkey string) (*comatprototypes.RepoGetRecord_Output, error) {
	_, svc, _, err := resolveRepoService(ctx, repo)
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoGetRecord: %w", err)
	}

	// if the service isn't the current host, we proxy the request
	if svc != s.cli.PublicHost {
		var out comatprototypes.RepoGetRecord_Output
		params := make(map[string]interface{})
		params["repo"] = repo
		params["collection"] = collection
		params["rkey"] = rkey
		if c != "" {
			params["cid"] = c
		}

		err = makeUnauthenticatedRequest(ctx, svc, "com.atproto.repo.getRecord", params, &out)
		if err != nil {
			log.Error(ctx, "upstream xrpc error", "error", err)
			return nil, err
		}
		return &out, nil
	}

	r, ses, err := atproto.OpenLexiconRepo(ctx)
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoGetRecord: failed to open repo: %w", err)
	}
	outCID, _, err := r.GetRecord(ctx, fmt.Sprintf("%s/%s", collection, rkey))
	if err != nil {
		return nil, err
	}
	rec, err := atproto.GetRecordCBOR(ctx, ses, outCID, collection, rkey)
	if err != nil {
		return nil, fmt.Errorf("handleComAtprotoRepoGetRecord: failed to get record: %w", err)
	}
	str := outCID.String()
	return &comatprototypes.RepoGetRecord_Output{
		Uri:   fmt.Sprintf("at://%s/%s/%s", repo, collection, rkey),
		Cid:   &str,
		Value: &lexutil.LexiconTypeDecoder{Val: rec},
	}, nil
}
