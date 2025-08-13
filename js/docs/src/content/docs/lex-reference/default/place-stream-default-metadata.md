---
title: place.stream.default.metadata
description: Reference for the place.stream.default.metadata lexicon
---

**Lexicon Version:** 1

## Definitions

<a name="main"></a>

### `main`

**Type:** `record`

Default metadata record for livestream including content warnings, rights, and
distribution policy

**Record Key:** `self`

**Record Properties:**

| Name                 | Type                                         | Req'd | Description                       | Constraints |
| -------------------- | -------------------------------------------- | ----- | --------------------------------- | ----------- |
| `contentWarnings`    | Array of `string`                            | ❌    | Content warnings for this stream. |             |
| `rights`             | [`#rights`](#rights)                         | ❌    |                                   |             |
| `distributionPolicy` | [`#distributionPolicy`](#distributionpolicy) | ❌    |                                   |             |

---

<a name="rights"></a>

### `rights`

**Type:** `object`

Content rights and attribution information

**Properties:**

| Name          | Type     | Req'd | Description                                                     | Constraints                     |
| ------------- | -------- | ----- | --------------------------------------------------------------- | ------------------------------- |
| `attribution` | `string` | ❌    | Attribution name or handle.                                     | Max Length: 100                 |
| `license`     | `string` | ❌    | License identifier (e.g. 'CC BY-NC-SA', 'All Rights Reserved'). |                                 |
| `usageTerms`  | `string` | ❌    | Additional notice or usage terms.                               | Max Length: 500                 |
| `year`        | `string` | ❌    | Year of creation or publication (e.g. '2025').                  | Min Length: 4<br/>Max Length: 4 |

---

<a name="distributionpolicy"></a>

### `distributionPolicy`

**Type:** `object`

Distribution and rebroadcast policy.

**Properties:**

| Name             | Type      | Req'd | Description                                                                                      | Constraints        |
| ---------------- | --------- | ----- | ------------------------------------------------------------------------------------------------ | ------------------ |
| `allowArchive`   | `boolean` | ❌    | Whether nodes can archive this stream.                                                           |                    |
| `broadcastUntil` | `string`  | ❌    | When rebroadcast permissions expire (ISO 8601 format). If not specified, no rebroadcast allowed. | Format: `datetime` |

---

## Lexicon Source

```json
{
  "lexicon": 1,
  "id": "place.stream.default.metadata",
  "defs": {
    "main": {
      "type": "record",
      "description": "Default metadata record for livestream including content warnings, rights, and distribution policy",
      "key": "self",
      "record": {
        "type": "object",
        "properties": {
          "contentWarnings": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Content warnings for this stream."
          },
          "rights": {
            "type": "ref",
            "ref": "#rights"
          },
          "distributionPolicy": {
            "type": "ref",
            "ref": "#distributionPolicy"
          }
        }
      }
    },
    "rights": {
      "type": "object",
      "description": "Content rights and attribution information",
      "properties": {
        "attribution": {
          "type": "string",
          "maxLength": 100,
          "description": "Attribution name or handle."
        },
        "license": {
          "type": "string",
          "description": "License identifier (e.g. 'CC BY-NC-SA', 'All Rights Reserved')."
        },
        "usageTerms": {
          "type": "string",
          "maxLength": 500,
          "description": "Additional notice or usage terms."
        },
        "year": {
          "type": "string",
          "minLength": 4,
          "maxLength": 4,
          "description": "Year of creation or publication (e.g. '2025')."
        }
      }
    },
    "distributionPolicy": {
      "type": "object",
      "description": "Distribution and rebroadcast policy.",
      "properties": {
        "allowArchive": {
          "type": "boolean",
          "description": "Whether nodes can archive this stream."
        },
        "broadcastUntil": {
          "type": "string",
          "format": "datetime",
          "description": "When rebroadcast permissions expire (ISO 8601 format). If not specified, no rebroadcast allowed."
        }
      }
    }
  }
}
```
