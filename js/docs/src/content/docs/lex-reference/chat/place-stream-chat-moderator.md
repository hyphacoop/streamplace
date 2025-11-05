---
title: place.stream.chat.moderator
description: Reference for the place.stream.chat.moderator lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="main"></a>

### `main`

**Type:** `record`

Record granting moderation permissions to a user for this streamer's chat.

**Record Key:** `tid`

**Record Properties:**

| Name          | Type              | Req'd | Description                                              | Constraints        |
| ------------- | ----------------- | ----- | -------------------------------------------------------- | ------------------ |
| `moderator`   | `string`          | ✅    | The DID of the user granted moderator permissions.       | Format: `did`      |
| `permissions` | Array of `string` | ✅    | Array of permissions granted to this moderator.          |                    |
| `createdAt`   | `string`          | ✅    | Client-declared timestamp when this moderator was added. | Format: `datetime` |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.chat.moderator",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "description": "Record granting moderation permissions to a user for this streamer's chat.",
      "record": {
        "type": "object",
        "required": ["moderator", "permissions", "createdAt"],
        "properties": {
          "moderator": {
            "type": "string",
            "format": "did",
            "description": "The DID of the user granted moderator permissions."
          },
          "permissions": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["ban", "hide", "timeout"]
            },
            "description": "Array of permissions granted to this moderator."
          },
          "createdAt": {
            "type": "string",
            "format": "datetime",
            "description": "Client-declared timestamp when this moderator was added."
          }
        }
      }
    }
  }
}
```
