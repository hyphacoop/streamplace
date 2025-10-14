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

| Name          | Type      | Req'd | Description                                                                                                             | Constraints |
| ------------- | --------- | ----- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| `deleteAfter` | `integer` | ❌    | Duration in seconds after which segments should be deleted. Each segment will expire N seconds after its creation time. |             |

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
          "type": "integer",
          "description": "Duration in seconds after which segments should be deleted. Each segment will expire N seconds after its creation time."
        }
      }
    }
  }
}
```
