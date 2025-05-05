---
title: place.stream.chat.message
description: Reference for the place.stream.chat.message lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="main"></a>

### `main`

**Type:** `record`

Record containing a Streamplace chat message.

**Record Key:** `tid`

**Record Properties:**

| Name        | Type                                                                                 | Req'd | Description                                                               | Constraints                             |
| ----------- | ------------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------- | --------------------------------------- |
| `text`      | `string`                                                                             | ✅    | The primary message content. May be an empty string, if there are embeds. | Max Length: 3000<br/>Max Graphemes: 300 |
| `createdAt` | `string`                                                                             | ✅    | Client-declared timestamp when this message was originally created.       | Format: `datetime`                      |
| `facets`    | Array of [`place.stream.richtext.facet`](/lex-reference/place-stream-richtext-facet) | ❌    | Annotations of text (mentions, URLs, etc)                                 |                                         |
| `streamer`  | `string`                                                                             | ✅    | The DID of the streamer whose chat this is.                               | Format: `did`                           |
| `reply`     | [`#replyRef`](#replyref)                                                             | ❌    |                                                                           |                                         |

---

<a name="replyref"></a>

### `replyRef`

**Type:** `object`

**Properties:**

| Name     | Type                                                                                                                                   | Req'd | Description | Constraints |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------- | ----------- |
| `root`   | [`com.atproto.repo.strongRef`](https://github.com/bluesky-social/atproto/tree/main/lexicons/com/atproto/repo/strongref.json#undefined) | ✅    |             |             |
| `parent` | [`com.atproto.repo.strongRef`](https://github.com/bluesky-social/atproto/tree/main/lexicons/com/atproto/repo/strongref.json#undefined) | ✅    |             |             |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.chat.message",
  "defs": {
    "main": {
      "type": "record",
      "description": "Record containing a Streamplace chat message.",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["text", "createdAt", "streamer"],
        "properties": {
          "text": {
            "type": "string",
            "maxLength": 3000,
            "maxGraphemes": 300,
            "description": "The primary message content. May be an empty string, if there are embeds."
          },
          "createdAt": {
            "type": "string",
            "format": "datetime",
            "description": "Client-declared timestamp when this message was originally created."
          },
          "facets": {
            "type": "array",
            "description": "Annotations of text (mentions, URLs, etc)",
            "items": {
              "type": "ref",
              "ref": "place.stream.richtext.facet"
            }
          },
          "streamer": {
            "type": "string",
            "format": "did",
            "description": "The DID of the streamer whose chat this is."
          },
          "reply": {
            "type": "ref",
            "ref": "#replyRef"
          }
        }
      }
    },
    "replyRef": {
      "type": "object",
      "required": ["root", "parent"],
      "properties": {
        "root": {
          "type": "ref",
          "ref": "com.atproto.repo.strongRef"
        },
        "parent": {
          "type": "ref",
          "ref": "com.atproto.repo.strongRef"
        }
      }
    }
  }
}
```
