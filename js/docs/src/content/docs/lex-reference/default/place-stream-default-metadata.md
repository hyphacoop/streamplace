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

**Record Key:** `literal:self`

**Record Properties:**

| Name                 | Type                                         | Req'd | Description                       | Constraints |
| -------------------- | -------------------------------------------- | ----- | --------------------------------- | ----------- |
| `contentWarnings`    | Array of `string`                            | ❌    | Content warnings for this stream. |             |
| `contentRights`      | [`#contentRights`](#contentrights)           | ❌    |                                   |             |
| `distributionPolicy` | [`#distributionPolicy`](#distributionpolicy) | ❌    |                                   |             |

---

<a name="contentrights"></a>

### `contentRights`

**Type:** `object`

Content rights and attribution information.

**Properties:**

| Name              | Type      | Req'd | Description                      | Constraints                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | --------- | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `creator`         | `string`  | ❌    | Name of the creator of the work. |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `copyrightNotice` | `string`  | ❌    | Copyright notice for the work.   |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `copyrightYear`   | `integer` | ❌    | Year of creation or publication. |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `license`         | `string`  | ❌    | License URL or identifier.       | Known Values: `place.stream.default.metadata#all-rights-reserved`, `place.stream.default.metadata#cc0_1__0`, `place.stream.default.metadata#cc-by_4_00`, `place.stream.default.metadata#cc-by-sa_4__0`, `place.stream.default.metadata#cc-by-nc_4__0`, `place.stream.default.metadata#cc-by-nc-sa_4__0`, `place.stream.default.metadata#cc-by-nd_4__0`, `place.stream.default.metadata#cc-by-nc-nd_4__0`, `place.stream.default.metadata#custom` |
| `creditLine`      | `string`  | ❌    | Credit line for the work.        |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

---

<a name="distributionpolicy"></a>

### `distributionPolicy`

**Type:** `object`

Distribution and rebroadcast policy.

**Properties:**

| Name              | Type      | Req'd | Description                                                                                              | Constraints        |
| ----------------- | --------- | ----- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| `allowArchive`    | `boolean` | ❌    | Whether nodes can archive this stream.                                                                   |                    |
| `broadcastExpiry` | `string`  | ❌    | When rebroadcast permissions expire. If not specified, there is no expiration on rebroadcast permission. | Format: `datetime` |

---

<a name="death"></a>

### `death`

**Type:** `token`

The content could be perceived as offensive due to the discussion or display of
death.

---

<a name="druguse"></a>

### `drugUse`

**Type:** `token`

The content contains a portrayal of the use or abuse of mind altering
substances.

---

<a name="fantasyviolence"></a>

### `fantasyViolence`

**Type:** `token`

The content contains violent actions of a fantasy nature, involving human or
non-human characters in situations easily distinguishable from real life.

---

<a name="flashinglights"></a>

### `flashingLights`

**Type:** `token`

The content contains flashing lights that could be harmful to viewers with
seizure disorders such as photosensitive epilepsy.

---

<a name="language"></a>

### `language`

**Type:** `token`

The content could be perceived as offensive due to the language used.

---

<a name="nudity"></a>

### `nudity`

**Type:** `token`

The content could be perceived as offensive due to nudity.

---

<a name="pii"></a>

### `PII`

**Type:** `token`

The content contains information that can be used to identify a particular
individual, such as a name, phone number, email address, physical address, or IP
address.

---

<a name="sexuality"></a>

### `sexuality`

**Type:** `token`

The content could be perceived as offensive due to the discussion or display of
sexuality.

---

<a name="suffering"></a>

### `suffering`

**Type:** `token`

The content could be perceived as distressing due to the discussion or display
of suffering or triggering topics, including suicide, eating disorders or self
harm.

---

<a name="violence"></a>

### `violence`

**Type:** `token`

The content could be perceived as offensive due to the discussion or display of
violence.

---

<a name="allrightsreserved"></a>

### `all-rights-reserved`

**Type:** `token`

All rights reserved to the creator — others cannot use, modify, or share without
explicit authorization.

---

<a name="cc010"></a>

### `cc0_1__0`

**Type:** `token`

Public domain dedication. You waive all copyright and related rights where
possible. Others may copy, modify, distribute, or perform your work for any
purpose without attribution.

---

<a name="ccby40"></a>

### `cc-by_4__0`

**Type:** `token`

Attribution required. Others may copy, distribute, remix, and build upon your
work, even commercially, if they credit you.

---

<a name="ccbysa40"></a>

### `cc-by-sa_4__0`

**Type:** `token`

Attribution + share-alike. Others may adapt and build upon your work, even
commercially, if they credit you and license their new creations under identical
terms.

---

<a name="ccbync40"></a>

### `cc-by-nc_4__0`

**Type:** `token`

Attribution + non-commercial. Others may adapt and build upon your work for
non-commercial purposes only, and must credit you.

---

<a name="ccbyncsa40"></a>

### `cc-by-nc-sa_4__0`

**Type:** `token`

Attribution + non-commercial + share-alike. Others may adapt and build upon your
work for non-commercial purposes only, must credit you, and must license their
new creations under identical terms.

---

<a name="ccbynd40"></a>

### `cc-by-nd_4__0`

**Type:** `token`

Attribution + no derivatives. Others may reuse your work, even commercially, but
it must remain unchanged and you must be credited.

---

<a name="ccbyncnd40"></a>

### `cc-by-nc-nd_4__0`

**Type:** `token`

Attribution + non-commercial + no derivatives. Others may download and share
your work with credit, but cannot change it or use it commercially.

---

<a name="custom"></a>

### `custom`

**Type:** `token`

Custom license. Define your own terms for how others can use, adapt, or share
your content.

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
      "key": "literal:self",
      "record": {
        "type": "object",
        "properties": {
          "contentWarnings": {
            "type": "array",
            "items": {
              "type": "string",
              "knownValues": [
                "place.stream.default.metadata#death",
                "place.stream.default.metadata#drugUse",
                "place.stream.default.metadata#fantasyViolence",
                "place.stream.default.metadata#flashingLights",
                "place.stream.default.metadata#language",
                "place.stream.default.metadata#nudity",
                "place.stream.default.metadata#PII",
                "place.stream.default.metadata#sexuality",
                "place.stream.default.metadata#suffering",
                "place.stream.default.metadata#violence"
              ]
            },
            "description": "Content warnings for this stream."
          },
          "contentRights": {
            "type": "ref",
            "ref": "#contentRights"
          },
          "distributionPolicy": {
            "type": "ref",
            "ref": "#distributionPolicy"
          }
        }
      }
    },
    "contentRights": {
      "type": "object",
      "description": "Content rights and attribution information.",
      "properties": {
        "creator": {
          "type": "string",
          "description": "Name of the creator of the work."
        },
        "copyrightNotice": {
          "type": "string",
          "description": "Copyright notice for the work."
        },
        "copyrightYear": {
          "type": "integer",
          "description": "Year of creation or publication."
        },
        "license": {
          "type": "string",
          "description": "License URL or identifier.",
          "knownValues": [
            "place.stream.default.metadata#all-rights-reserved",
            "place.stream.default.metadata#cc0_1__0",
            "place.stream.default.metadata#cc-by_4_00",
            "place.stream.default.metadata#cc-by-sa_4__0",
            "place.stream.default.metadata#cc-by-nc_4__0",
            "place.stream.default.metadata#cc-by-nc-sa_4__0",
            "place.stream.default.metadata#cc-by-nd_4__0",
            "place.stream.default.metadata#cc-by-nc-nd_4__0",
            "place.stream.default.metadata#custom"
          ]
        },
        "creditLine": {
          "type": "string",
          "description": "Credit line for the work."
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
        "broadcastExpiry": {
          "type": "string",
          "format": "datetime",
          "description": "When rebroadcast permissions expire. If not specified, there is no expiration on rebroadcast permission."
        }
      }
    },
    "death": {
      "type": "token",
      "description": "The content could be perceived as offensive due to the discussion or display of death."
    },
    "drugUse": {
      "type": "token",
      "description": "The content contains a portrayal of the use or abuse of mind altering substances."
    },
    "fantasyViolence": {
      "type": "token",
      "description": "The content contains violent actions of a fantasy nature, involving human or non-human characters in situations easily distinguishable from real life."
    },
    "flashingLights": {
      "type": "token",
      "description": "The content contains flashing lights that could be harmful to viewers with seizure disorders such as photosensitive epilepsy."
    },
    "language": {
      "type": "token",
      "description": "The content could be perceived as offensive due to the language used."
    },
    "nudity": {
      "type": "token",
      "description": "The content could be perceived as offensive due to nudity."
    },
    "PII": {
      "type": "token",
      "description": "The content contains information that can be used to identify a particular individual, such as a name, phone number, email address, physical address, or IP address."
    },
    "sexuality": {
      "type": "token",
      "description": "The content could be perceived as offensive due to the discussion or display of sexuality."
    },
    "suffering": {
      "type": "token",
      "description": "The content could be perceived as distressing due to the discussion or display of suffering or triggering topics, including suicide, eating disorders or self harm."
    },
    "violence": {
      "type": "token",
      "description": "The content could be perceived as offensive due to the discussion or display of violence."
    },
    "all-rights-reserved": {
      "type": "token",
      "description": "All rights reserved to the creator — others cannot use, modify, or share without explicit authorization."
    },
    "cc0_1__0": {
      "type": "token",
      "description": "Public domain dedication. You waive all copyright and related rights where possible. Others may copy, modify, distribute, or perform your work for any purpose without attribution."
    },
    "cc-by_4__0": {
      "type": "token",
      "description": "Attribution required. Others may copy, distribute, remix, and build upon your work, even commercially, if they credit you."
    },
    "cc-by-sa_4__0": {
      "type": "token",
      "description": "Attribution + share-alike. Others may adapt and build upon your work, even commercially, if they credit you and license their new creations under identical terms."
    },
    "cc-by-nc_4__0": {
      "type": "token",
      "description": "Attribution + non-commercial. Others may adapt and build upon your work for non-commercial purposes only, and must credit you."
    },
    "cc-by-nc-sa_4__0": {
      "type": "token",
      "description": "Attribution + non-commercial + share-alike. Others may adapt and build upon your work for non-commercial purposes only, must credit you, and must license their new creations under identical terms."
    },
    "cc-by-nd_4__0": {
      "type": "token",
      "description": "Attribution + no derivatives. Others may reuse your work, even commercially, but it must remain unchanged and you must be credited."
    },
    "cc-by-nc-nd_4__0": {
      "type": "token",
      "description": "Attribution + non-commercial + no derivatives. Others may download and share your work with credit, but cannot change it or use it commercially."
    },
    "custom": {
      "type": "token",
      "description": "Custom license. Define your own terms for how others can use, adapt, or share your content."
    }
  }
}
```
