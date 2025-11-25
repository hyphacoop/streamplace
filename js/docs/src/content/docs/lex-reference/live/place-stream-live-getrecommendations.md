---
title: place.stream.live.getRecommendations
description: Reference for the place.stream.live.getRecommendations lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="main"></a>

### `main`

**Type:** `query`

Get the list of streamers recommended by a user

**Parameters:**

| Name      | Type     | Req'd | Description                                        | Constraints   |
| --------- | -------- | ----- | -------------------------------------------------- | ------------- |
| `userDID` | `string` | ✅    | The DID of the user whose recommendations to fetch | Format: `did` |

**Output:**

- **Encoding:** `application/json`
- **Schema:**

**Schema Type:** `object`

| Name        | Type              | Req'd | Description                                   | Constraints   |
| ----------- | ----------------- | ----- | --------------------------------------------- | ------------- |
| `streamers` | Array of `string` | ✅    | Ordered list of recommended streamer DIDs     |               |
| `userDID`   | `string`          | ❌    | The user who created this recommendation list | Format: `did` |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.live.getRecommendations",
  "defs": {
    "main": {
      "type": "query",
      "description": "Get the list of streamers recommended by a user",
      "parameters": {
        "type": "params",
        "required": ["userDID"],
        "properties": {
          "userDID": {
            "type": "string",
            "format": "did",
            "description": "The DID of the user whose recommendations to fetch"
          }
        }
      },
      "output": {
        "encoding": "application/json",
        "schema": {
          "type": "object",
          "required": ["streamers"],
          "properties": {
            "streamers": {
              "type": "array",
              "description": "Ordered list of recommended streamer DIDs",
              "items": {
                "type": "string",
                "format": "did"
              }
            },
            "userDID": {
              "type": "string",
              "format": "did",
              "description": "The user who created this recommendation list"
            }
          }
        }
      }
    }
  }
}
```
