---
title: Getting Started with Streamplace Development
description: Learn how to set up your development environment for Streamplace.
---

So, you've decided to contribute to Streamplace development. Here's how you can
get started:

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
  - A way to install it is with `pnpm/npm install -g yarn` if corepack is not
    enabled in your node install.
- Go (version 1.24)
  - If you use `mise`, you can install latest Go 1.24 with
    `mise install go@prefix:1.24`
- Meson
- Ninja
- pkg-config

## Get Started

### Streamplace Node

1. Install prereqs
2. `make dev-setup`

Now you're ready to start developing! The app can be rebuilt with `make dev`, so
as you make changes to the node, you can run your app something like this:

```
make dev && ./build-darwin-arm64/streamplace

// or

make dev && ./build-linux-amd64/streamplace
```

### Streamplace App

#### Web

1. `yarn install`
2. `yarn run app start`

#### iOS/Android

1. `yarn install`
2. `yarn run app ios` or `yarn run app android`

You can also specify a physical device with something like
`yarn run app ios -d 'Stream’s iPhone'`. Note also that this command runs a full
native build of the iOS/Android app, which is not necessary in many cases: once
you have a copy of the `Devplace` app on your device or emulator, you can boot
the dev server back up with `yarn run app start`.

### Streamplace Desktop

1. `yarn install`
2. `yarn run desktop start`

By default Streamplace Desktop will assume there's a local node to connect to,
running with something like `make dev && ./build-linux-amd64/streamplace` above.
