---
title: Localization for Developers
description: Things to consider when writing content that will be localized.
sidebar:
  order: 20
---

Hello! Here are some things to keep in mind when writing content that includes
copy that will be localized.

This includes (but is not limited to):

- Button prompts
- Menu items
- Error messages
- Notifications
- Any other text that users will see

This is **NOT**:

- User submitted content (e.g. chat messages, stream titles, etc)

## Quick start

1. Most of the time, you'll use the useTranslation hook from `react-i18next` to
   wrap any text that will be localized:

```ts
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('settings-title')}</h1>

      {/* With variables */}
      <p>{t('welcome-user', { username: 'Alice' })}</p>

      {/* With count (triggers pluralization) */}
      <span>{t('notification-count', { count: 5 })}</span>
    </div>
  );
}
```

2. For complex React components, use the `Trans` function from `react-i18next`
   to wrap any text that will be localized. As long you have no React/HTML nodes
   integrated into a cohesive sentence (text formatting like strong, em, link
   components, maybe others), you won't need it. Most of the times you will be
   using the above `t` function. You should probably import it as `T` to save
   some typing:

```tsx
import { Trans as T } from "react-i18next";

function HelpText() {
  return (
    <T
      i18nKey="help-message"
      components={{
        supportLink: <a href="mailto:support@stream.place" />,
        docsLink: <a href="/docs" />,
        bold: <strong />,
      }}
      values={{
        username: "Alice",
        supportEmail: "support@stream.place",
      }}
    >
      Hi <bold>{{ username }}</bold>! Need help? Contact{" "}
      <supportLink>{{ supportEmail }}</supportLink>
      or check our <docsLink>documentation</docsLink>.
    </T>
  );
}
```

## Workflow

1. Add translation keys in your code as shown above.

```ts
// ❌ Don't hardcode text
<h1>Settings</h1>
<p>You have 5 new messages</p>

// ✅ Use translation keys
<h1>{t('settings-title')}</h1>
<p>{t('message-count', { count: 5 })}</p>
```

2. Add English translations (or others if you're proficient) to the .ftl files
   in `js/components/locales/`:

```fluent
# Edit: js/components/locales/en-US/settings.ftl
settings-title = Settings
message-count = { $count ->
    [0] No messages
    [1] You have one new message
   *[other] You have { $count } new messages
}
```

3. Compile the translations to JSON:

```bash
cd js/components
pnpm i18n:compile
```

This reads the `.ftl` files and outputs compiled JSON to
`js/components/public/locales/{locale}/messages.json`.

4. For web: the compiled files in `public/locales/` are served as static assets
   and loaded on demand.

For native: the compiled files are bundled with the app via static `require()`
calls in the components package.

## Project structure

The i18n system is centralized in `@streamplace/components`:

```
js/components/
├── locales/                   # Source .ftl files
│   ├── en-US/
│   │   └── settings.ftl
│   ├── pt-BR/
│   ├── es-ES/
│   ├── zh-TW/
│   └── fr-FR/
├── src/i18n/
│   ├── manifest.json          # Supported locales and metadata
│   ├── i18next-config.ts      # Bootstrap configuration
│   ├── provider.tsx           # React provider components
│   └── index.ts               # Public exports
├── public/locales/            # Compiled JSON output
│   ├── en-US/
│   │   └── messages.json
│   └── ...
└── scripts/
    ├── compile-translations.js
    └── extract-i18n.js
```

The app imports i18n from `@streamplace/components`:

```ts
import { i18next, useTranslation } from "@streamplace/components";
```

## Available scripts

In `js/components`:

- `pnpm i18n:compile` - Compile .ftl files to JSON
- `pnpm i18n:watch` - Watch .ftl files and recompile on changes
- `pnpm i18n:extract` - Extract translation keys from source code (TODO: needs
  path updates)

## Keep in mind...

### Keys are important

Choose meaningful keys that describe the content, not the presentation. They
should be descriptive and scoped.

```fluent
user-welcome-message = Welcome back, { $username }!
settings-account-title = Account Settings
error-network-connection = Connection failed
button-save-changes = Save Changes
form-validation-email-invalid = Please enter a valid email address
```

### Platform differences

The system handles both web and React Native:

- **Web**: loads translations via HTTP from `/locales/{locale}/messages.json`
- **React Native**: bundles translations via static `require()` calls

The bootstrap code in `@streamplace/components/i18n` automatically detects the
platform and uses the appropriate loading strategy.

### Adding new locales

1. Add the locale to `js/components/src/i18n/manifest.json`:

```json
{
  "supportedLocales": [
    "en-US",
    "pt-BR",
    "es-ES",
    "zh-TW",
    "fr-FR",
    "new-LOCALE"
  ],
  "languages": {
    "new-LOCALE": {
      "code": "new-LOCALE",
      "name": "Language Name",
      "nativeName": "Native Name",
      "flag": "🏁"
    }
  }
}
```

2. Create the locale directory and .ftl files in
   `js/components/locales/new-LOCALE/`

3. Add a static `require()` case in `js/components/src/i18n/i18next-config.ts`:

```ts
case "new-LOCALE":
  translations = require("../../public/locales/new-LOCALE/messages.json");
  break;
```

4. Run `pnpm i18n:compile` to generate the JSON file

You can also
[view the official Fluent docs](https://github.com/projectfluent/fluent/wiki/Good-Practices-for-Developers)
to learn how to write better Fluent messages.
