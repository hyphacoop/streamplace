---
title: "C2PA Integration"
sidebar:
  order: 40
---

The actual metadata insertion and signing done to each video segment is through
[C2PA](https://c2pa.org/) tooling. A
[fork](https://github.com/hyphacoop/c2pa-rs/tree/es256k-rebase) of their Rust
SDK that adds support for ES256K is used, and called in Go through FFI. The code
for this can be seen in `rust/iroh-streamplace/src/c2pa.rs`.

The metadata stored in the video with C2PA must be in a valid C2PA "manifest"
format, documented in the specification. Here is an example Streamplace
manifest, extracted from the MP4 segment using
[c2patool](https://github.com/contentauth/c2pa-rs/tree/main/cli).

```json
{
  "active_manifest": "urn:c2pa:81079123-e073-494f-b2cb-c0f3fae61efc",
  "manifests": {
    "urn:c2pa:81079123-e073-494f-b2cb-c0f3fae61efc": {
      "claim_generator_info": [
        {
          "name": "c2pa-rs",
          "version": "0.58.0",
          "org.contentauth.c2pa_rs": "0.58.0"
        }
      ],
      "title": "Livestream Segment at 2025-10-08T15:19:00.895Z",
      "instance_id": "xmp:iid:a54aedfb-9bf2-471f-9a38-dbbdd54060fa",
      "ingredients": [],
      "assertions": [
        {
          "label": "c2pa.actions.v2",
          "data": {
            "actions": [
              {
                "action": "c2pa.created"
              },
              {
                "action": "c2pa.published"
              }
            ],
            "allActionsIncluded": false
          }
        },
        {
          "label": "c2pa.hash.bmff.v3",
          "data": {
            "exclusions": [
              {
                "xpath": "/uuid",
                "length": null,
                "data": [
                  {
                    "offset": 8,
                    "value": "2P7D1hsOSDySl1goh37EgQ=="
                  }
                ],
                "subset": null,
                "version": null,
                "flags": null,
                "exact": null
              },
              {
                "xpath": "/ftyp",
                "length": null,
                "data": null,
                "subset": null,
                "version": null,
                "flags": null,
                "exact": null
              },
              {
                "xpath": "/mfra",
                "length": null,
                "data": null,
                "subset": null,
                "version": null,
                "flags": null,
                "exact": null
              }
            ],
            "alg": "sha256",
            "hash": "708u7jVcOE1EsN2TQX+K2vidjhgSDimo8xfDzLfecsk=",
            "name": "jumbf manifest"
          }
        },
        {
          "label": "place.stream.metadata",
          "data": {
            "@context": {
              "photoshop": "http://ns.adobe.com/photoshop/1.0/",
              "Iptc4xmpExt": "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
              "dc": "http://purl.org/dc/elements/1.1/",
              "xmpRights": "http://ns.adobe.com/xap/1.0/rights/"
            },
            "dc:title": ["Test"],
            "distributionPolicy": {
              "deleteAfter": "2025-10-08T15:24:00.000Z"
            },
            "xmpRights:UsageTerms": "All rights reserved",
            "Iptc4xmpExt:ContentWarning": ["cwarn:flashingLights"],
            "dc:creator": "did:plc:2j2ounbiyi3ftihronlw5qhj",
            "dc:date": ["2025-10-08T15:19:00.895Z"]
          },
          "kind": "Json"
        }
      ],
      "signature_info": {
        "issuer": "Streamplace",
        "common_name": "did:key:zQ3shoX1bhiMNLJ7UTMVKazUByeaLSLx28PbpihL5C7ASGENz",
        "cert_serial_number": "14378093328514229579390314818363024382"
      },
      "label": "urn:c2pa:81079123-e073-494f-b2cb-c0f3fae61efc"
    }
  }
}
```

TODO: use updated manifest

The official version of c2patool can extract this manifest, but will not
consider it valid due to the use of ES256K. If you build c2patool from the
[fork](https://github.com/hyphacoop/c2pa-rs/tree/es256k-rebase) used by
Streamplace, it will validate.

Note the variety of information stored in the manifest: user DID, signing key,
timestamp, content warnings, copyright, etc. More can be added in the future,
for example whether you consent to remixing.

You can see one the `assertions` is called `place.stream.metadata.configuration`.
This is the same as the lexicon, and holds all the configuration information
for this livestream. It's the easiest place to parse out this metadata.

Some metadata (like content rights) might be duplicated in other `assertions`,
that aren't custom and are mentioned in the C2PA spec. This allows
C2PA-compatible software not familiar with Streamplace to still display
information about the video content.

## Code paths

The C2PA manifest is built from the existing livestream metadata in
`pkg/media/manifest_builder.go`. This `ManifestBuilder` does the work of mapping
metadata settings from the user stored in the database into C2PA manifest
information. This is used by the media signer (`pkg/media/media_signer.go`)
which calls the Go-Rust wrapper to actually perform the C2PA injection into the
MP4, located at `pkg/iroh/generated/iroh_streamplace/iroh_streamplace.go` and
`rust/iroh-streamplace/src/c2pa.rs`.

The stream key is what is used for C2PA signing.

## Transcoding

C2PA supports linking media in a hierarchy, where one piece of media can derive
from one or more parents. Although this is not supported by Streamplace yet, in
the future it will be possible to add this information into video metadata when
a segment gets transcoded. The output video segment will contain a
`c2pa.transcoded` action that links back to the original video segment.
