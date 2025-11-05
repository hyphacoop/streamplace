---
title: place.stream.chat.block
description: Reference for the place.stream.chat.block lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="main"></a>

### `main`

**Type:** `record`

Record blocking a user from a specific streamer's chat.

**Record Key:** `tid`

**Record Properties:**

| Name        | Type     | Req'd | Description                                               | Constraints        |
| ----------- | -------- | ----- | --------------------------------------------------------- | ------------------ |
| `streamer`  | `string` | ✅    | The DID of the streamer whose chat this block applies to. | Format: `did`      |
| `subject`   | `string` | ✅    | The DID of the user being blocked from chat.              | Format: `did`      |
| `reason`    | `string` | ❌    | Optional reason for the block.                            | Max Length: 300    |
| `createdAt` | `string` | ✅    | Client-declared timestamp when this block was created.    | Format: `datetime` |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.chat.block",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "description": "Record blocking a user from a specific streamer's chat.",
      "record": {
        "type": "object",
        "required": ["streamer", "subject", "createdAt"],
        "properties": {
          "streamer": {
            "type": "string",
            "format": "did",
            "description": "The DID of the streamer whose chat this block applies to."
          },
          "subject": {
            "type": "string",
            "format": "did",
            "description": "The DID of the user being blocked from chat."
          },
          "reason": {
            "type": "string",
            "maxLength": 300,
            "description": "Optional reason for the block."
          },
          "createdAt": {
            "type": "string",
            "format": "datetime",
            "description": "Client-declared timestamp when this block was created."
          }
        }
      }
    }
  }
}
```
