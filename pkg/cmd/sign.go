package cmd

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"

	"git.stream.place/streamplace/c2pa-go/pkg/c2pa"
	"github.com/decred/dcrd/dcrec/secp256k1"
	"github.com/mr-tron/base58"
	"stream.place/streamplace/pkg/crypto/aqpub"
	"stream.place/streamplace/pkg/log"
	"stream.place/streamplace/pkg/media"
)

func Sign(ctx context.Context) error {
	fs := flag.NewFlagSet("streamplace", flag.ExitOnError)
	certPath := fs.String("cert", "", "path to the certificate file")
	key := fs.String("key", "", "base58-encoded secp256k1 private key")
	streamerName := fs.String("streamer", "", "streamer name")
	taURL := fs.String("ta-url", "http://timestamp.digicert.com", "timestamp authority server for signing")
	startTime := fs.Int64("start-time", 0, "start time of the stream")
	manifestJSON := fs.String("manifest", "", "JSON manifest to use for signing")
	if err := fs.Parse(os.Args[2:]); err != nil {
		return err
	}

	log.Debug(ctx, "Sign command: starting",
		"streamer", *streamerName,
		"startTime", *startTime,
		"hasManifest", *manifestJSON != "")

	keyBs, err := base58.Decode(*key)
	if err != nil {
		return err
	}

	if *streamerName == "" {
		return fmt.Errorf("streamer name is required")
	}

	secpSigner, _ := secp256k1.PrivKeyFromBytes(keyBs)
	if secpSigner == nil {
		return fmt.Errorf("invalid key")
	}
	signer := secpSigner.ToECDSA()

	certBs, err := os.ReadFile(*certPath)
	if err != nil {
		return err
	}

	pub, err := aqpub.FromPublicKey(signer.Public().(*ecdsa.PublicKey))
	if err != nil {
		return err
	}

	var manifest *c2pa.ManifestDefinition
	if *manifestJSON != "" {
		log.Debug(ctx, "Sign command: parsing provided manifest JSON", "jsonLength", len(*manifestJSON))

		// Parse the provided manifest directly as C2PA manifest
		if err := json.Unmarshal([]byte(*manifestJSON), &manifest); err != nil {
			log.Error(ctx, "Sign command: failed to parse manifest JSON", "error", err)
			return fmt.Errorf("failed to parse manifest JSON: %w", err)
		}

		log.Debug(ctx, "Sign command: successfully parsed manifest",
			"title", manifest.Title,
			"assertionsCount", len(manifest.Assertions))
	} else {
		log.Debug(ctx, "Sign command: no manifest provided, will use default")
	}

	ms := &media.MediaSignerLocal{
		Signer:       signer,
		Cert:         certBs,
		StreamerName: *streamerName,
		TAURL:        *taURL,
		AQPub:        pub,
		Manifest:     manifest, // Pass manifest to local signer
	}

	inputBs, err := io.ReadAll(os.Stdin)
	if err != nil {
		return err
	}

	mp4, err := ms.SignMP4(ctx, bytes.NewReader(inputBs), *startTime)
	if err != nil {
		return err
	}
	_, err = io.Copy(os.Stdout, bytes.NewReader(mp4))
	if err != nil {
		return err
	}

	return nil
}
