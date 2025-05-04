---
title: Getting Started with Streamplace Development
description: Learn how to set up your development environment for Streamplace.
---

So, you've decided to contribute to Streamplace development. Here's how you can
get started:

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
  - A way to install it is with `pnpm/npm install -g yarn`. No corepack in this
    repo _just_ yet.
- Go (version 1.24)
  - If you use `mise`, you can install latest Go 1.23 with
    `mise install go@prefix:1.23`
- Meson
- Ninja

### For development only

- pkg-config

## Get Started

1. Install prereqs
2. Download JS packages with `yarn`
3. `make dev-setup`
4. `make dev`
5. launch via `./build-<platform>-<arch>/streamplace`
