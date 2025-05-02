---
title: place.stream.defs
description: Reference for the place.stream.defs lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="blockview"></a>

### `blockView`

**Type:** `object`

**Properties:**

| Name        | Type                                                                                                                                             | Req'd | Description | Constraints        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ----------- | ------------------ |
| `uri`       | `string`                                                                                                                                         | ✅    |             | Format: `at-uri`   |
| `cid`       | `string`                                                                                                                                         | ✅    |             | Format: `cid`      |
| `blocker`   | [`app.bsky.actor.defs#profileViewBasic`](https://github.com/bluesky-social/atproto/tree/main/lexicons/app/bsky/actor/defs.json#profileViewBasic) | ✅    |             |                    |
| `record`    | [`app.bsky.graph.block`](https://github.com/bluesky-social/atproto/tree/main/lexicons/app/bsky/graph/block.json#undefined)                       | ✅    |             |                    |
| `indexedAt` | `string`                                                                                                                                         | ✅    |             | Format: `datetime` |

---

<a name="renditions"></a>

### `renditions`

**Type:** `object`

**Properties:**

| Name         | Type                                | Req'd | Description | Constraints |
| ------------ | ----------------------------------- | ----- | ----------- | ----------- |
| `renditions` | Array of [`#rendition`](#rendition) | ✅    |             |             |

---

<a name="rendition"></a>

### `rendition`

**Type:** `object`

**Properties:**

| Name   | Type     | Req'd | Description | Constraints |
| ------ | -------- | ----- | ----------- | ----------- |
| `name` | `string` | ✅    |             |             |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.defs",
  "defs": {
    "blockView": {
      "type": "object",
      "required": ["uri", "cid", "blocker", "record", "indexedAt"],
      "properties": {
        "uri": {
          "type": "string",
          "format": "at-uri"
        },
        "cid": {
          "type": "string",
          "format": "cid"
        },
        "blocker": {
          "type": "ref",
          "ref": "app.bsky.actor.defs#profileViewBasic"
        },
        "record": {
          "type": "ref",
          "ref": "app.bsky.graph.block"
        },
        "indexedAt": {
          "type": "string",
          "format": "datetime"
        }
      }
    },
    "renditions": {
      "type": "object",
      "required": ["renditions"],
      "properties": {
        "renditions": {
          "type": "array",
          "items": {
            "type": "ref",
            "ref": "#rendition"
          }
        }
      }
    },
    "rendition": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {
          "type": "string"
        }
      }
    }
  }
}
```
