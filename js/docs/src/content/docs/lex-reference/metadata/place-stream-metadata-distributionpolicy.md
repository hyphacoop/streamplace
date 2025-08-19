---
title: place.stream.metadata.distributionPolicy
description: Reference for the place.stream.metadata.distributionPolicy lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="main"></a>

### `main`

**Type:** `object`

Distribution and rebroadcast policy.

**Properties:**

| Name          | Type     | Req'd | Description                                                                                 | Constraints        |
| ------------- | -------- | ----- | ------------------------------------------------------------------------------------------- | ------------------ |
| `deleteAfter` | `string` | ❌    | When this stream should be deleted. If not specified, the stream will be kept indefinitely. | Format: `datetime` |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.metadata.distributionPolicy",
  "defs": {
    "main": {
      "type": "object",
      "description": "Distribution and rebroadcast policy.",
      "properties": {
        "deleteAfter": {
          "type": "string",
          "format": "datetime",
          "description": "When this stream should be deleted. If not specified, the stream will be kept indefinitely."
        }
      }
    }
  }
}
```
