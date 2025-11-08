# Streamplace Architecture

Streamplace is a live video streaming platform built on top of the AT Protocol.
This document describes the high-level architecture of the codebase, focusing on
modules, services, and how they interact.

## Go Backend Architecture Diagram

## Overview

Streamplace consists of:

- **Backend**: Go services handling media processing, API endpoints, and AT
  Protocol integration
- **Frontend**: TypeScript/React Native applications for web, iOS, and Android
- **Peer-to-peer**: Rust-based Iroh networking for decentralized segment
  distribution
- **Build System**: Meson-based compilation of native dependencies (GStreamer,
  FFmpeg)

## Repository Structure

```
streamplace/
├── pkg/              # Go backend packages
├── js/               # TypeScript/JavaScript frontend packages
├── rust/             # Rust bindings and services
├── cmd/              # Go application entry points
├── lexicons/         # AT Protocol lexicon definitions
├── subprojects/      # Third-party native dependencies (Meson)
├── docker/           # Container configurations
├── util/             # Build and deployment utilities
└── test/             # Integration tests
```

## Backend Architecture (Go)

The backend is written in Go and organized into ~40 packages under `pkg/`. Key
modules include:

### Core Services

- **`api`**: HTTP/WebSocket API server

  - Serves the web frontend and handles REST/XRPC endpoints
  - OAuth integration via `oatproxy`
  - Rate limiting, CORS, metrics
  - Integrates with all major backend services

- **`director`**: Stream lifecycle manager

  - Manages stream sessions for active broadcasts
  - Coordinates media processing pipelines
  - Handles transcoding decisions and caching
  - Routes segments to appropriate processors

- **`media`**: Media processing and encoding

  - GStreamer integration for video/audio manipulation
  - WebRTC ingestion and playback
  - Segment generation and packaging
  - HLS manifest generation (M3U8)
  - Video thumbnail generation
  - C2PA metadata signing and validation

- **`model`**: Data access layer

  - Database abstractions for storing streams, users, segments
  - AT Protocol record types
  - Query interfaces used by other services

- **`statedb`**: State management
  - In-memory state tracking for active streams
  - Coordination between distributed nodes
  - Cache management

### AT Protocol Integration

- **`atproto`**: AT Protocol synchronizer

  - Syncs data with the AT Protocol network (PDS, AppView, etc.)
  - Handles identity resolution and authentication
  - Manages AT Protocol repositories and records

- **`spxrpc`**: Lexicon-generated RPC handlers

  - Auto-generated from lexicon definitions
  - Implements Streamplace-specific XRPC methods
  - Type-safe protocol implementation

- **`streamplace`**: Lexicon-generated types
  - Go types for Streamplace lexicons
  - Serialization/deserialization

### Media Infrastructure

- **`mist`**: MistServer integration

  - Interfaces with MistServer (external media server)
  - Handles RTMP/RTMPS ingestion
  - Stream configuration and triggers

- **`rtmps`**: RTMPS server

  - Secure RTMP ingestion endpoint
  - Stream key validation
  - Routing to media processing pipeline

- **`rtcrec`**: WebRTC recording

  - Records WebRTC streams to disk
  - Used for stream archival

- **`renditions`**: Multi-bitrate encoding

  - Transcoding streams to multiple quality levels
  - Adaptive bitrate streaming support

- **`thumbnail`**: Thumbnail generation
  - Extracts frames from video streams
  - Generates preview images

### Supporting Infrastructure

- **`bus`**: Internal message bus

  - Pub/sub system for inter-component communication
  - Segment notifications, events, state changes

- **`storage`**: Storage abstraction

  - Interfaces for blob/file storage
  - Local filesystem and remote storage backends

- **`replication`**: Data replication

  - Segment distribution across nodes
  - Peer-to-peer coordination via Iroh

- **`iroh`**: Iroh Rust bindings

  - Go bindings to Rust Iroh library
  - P2P networking for segment sharing
  - Generated via uniffi-bindgen-go

- **`crypto`**: Cryptographic operations

  - EIP712 signing for metadata
  - ES256K algorithm support (secp256k1)
  - Key management

- **`linking`**: Service linking/discovery

  - Connects Streamplace nodes to external services
  - OAuth flows for third-party integrations

- **`integrations`**: External service integrations

  - Livepeer integration for transcoding
  - Webhooks and event forwarding

- **`notifications`**: Push notifications

  - Firebase Cloud Messaging integration
  - User notification delivery

- **`config`**: Configuration management

  - CLI argument parsing
  - Environment-based configuration
  - Build flags and version info

- **`log`**: Structured logging

  - Application-wide logging infrastructure
  - Context-aware logging

- **`spmetrics`**: Metrics collection
  - Prometheus metrics
  - Performance monitoring

### Utilities

- **`aqhttp`**, **`aqio`**, **`aqtime`**: Utility libraries for HTTP, I/O, and
  time operations
- **`constants`**: Shared constants
- **`errors`**: Error types and handling
- **`schema`**: Schema validation
- **`spid`**: ID generation
- **`devenv`**: Development environment helpers
- **`multitest`**: Testing utilities

### Entry Points

The entry point logic is organized in `pkg/cmd/`:

- **Main server mode** (default): Starts the full Streamplace server with all
  services

  - Runs GStreamer self-test on startup (retries up to 3 times if needed)
  - Initializes all services: API, director, media manager, AT Protocol sync,
    replication, etc.
  - Handles graceful shutdown on signals (SIGINT, SIGTERM, SIGQUIT, SIGABRT)
  - Configuration via CLI flags

- **CLI subcommands**: Various utility commands for testing and operations

  - `stream`: HTTP stream fetcher (pipes URL content to stdout)
  - `live`: Live stream ingestion via HTTP (reads stdin, POSTs to internal
    endpoint)
  - `clip`: Video clipping/concatenation tool using GStreamer
  - `whip`: WHIP (WebRTC HTTP Ingestion Protocol) client for testing/load
    testing
  - `whep`: WHEP (WebRTC HTTP Egress Protocol) client for playback testing
  - `sign`: C2PA metadata signing tool (signs video segments)
  - `self-test`: GStreamer functionality test
  - `migrate`: Database migration tool
  - `livepeer`: Embedded Livepeer transcoding node
  - `version`: Print version information

- **`cmd/libstreamplace`**: Library wrapper

  - Builds as a library (`libstreamplace`) for embedding
  - Exports `StreamplaceMain()` function
  - Used by desktop and mobile apps

- **`cmd/streamplace`**: Standalone binary
  - Minimal C wrapper around libstreamplace
  - For static compilation

## Frontend Architecture (TypeScript)

The frontend is organized into workspaces under `js/`:

### Main Applications

- **`js/app`**: React Native application

  - Mobile apps (iOS, Android) and web frontend
  - Built with Expo
  - WebRTC video streaming client
  - AT Protocol authentication via OAuth
  - State management with Redux Toolkit
  - Video player with HLS.js (web) and native players (mobile)

- **`js/desktop`**: Electron desktop application

  - Embeds the Node.js backend and React frontend
  - Cross-platform desktop builds (Windows, macOS, Linux)
  - Uses electron-forge for packaging

- **`js/docs`**: Documentation site
  - Built with Astro/Starlight
  - API reference, guides, lexicon docs

### Shared Libraries

- **`js/streamplace`**: Streamplace API client

  - TypeScript client for Streamplace XRPC API
  - Auto-generated from lexicons
  - Used by all frontend applications

- **`js/components`**: Shared React (Native) components

  - Video player components
  - UI primitives
  - Reusable across web and mobile

- **`js/atproto-oauth-client-react-native`**: OAuth client for React Native

  - AT Protocol authentication flows
  - Token management

- **`js/dev-env`**: Development environment tooling
- **`js/config-react-native-webrtc`**: WebRTC configuration for React Native

## Rust Services

Located in `rust/`:

### `iroh-streamplace`

Rust library providing peer-to-peer segment distribution using the Iroh
networking stack:

- **Iroh integration**: Uses Iroh for QUIC-based P2P networking
- **Gossip protocol**: Distributes segment availability information
- **RPC layer**: Custom protocol for segment subscription/distribution
- **C2PA support**: Integrates C2PA content provenance library
- **Go bindings**: Exports functionality to Go via uniffi

The library compiles to both static and dynamic libraries, with Go bindings
generated by `uniffi-bindgen-go`.

### `export-c2pa-schema`

Utility for exporting C2PA JSON schemas used in metadata generation.

## Lexicons (AT Protocol Schemas)

Located in `lexicons/place/stream/`:

Lexicons define the data schemas and XRPC methods for Streamplace's AT Protocol
integration:

- **Records**: Stream metadata, segments, keys, livestream records
- **Queries**: Get live users, segments, profile cards, etc.
- **Procedures**: Create webhooks, manage settings
- **Definitions**: Common types used across lexicons

Code generation:

- **Go**: `make lexgen` generates server handlers and types in `pkg/spxrpc/` and
  `pkg/streamplace/`
- **TypeScript**: `make js-lexicons` generates client SDK in
  `js/streamplace/src/lexicons/`
- **Markdown**: `make md-lexicons` generates API docs for the documentation site

## Build System

### Meson + Ninja

The build system uses Meson to compile native dependencies:

- **GStreamer**: Media framework (version 1.0+, compiled from source)
- **FFmpeg**: Video encoding/decoding (via gst-libav)
- **fdk-aac**: AAC audio encoding
- **x264**: H.264 video encoding
- **opus**: Opus audio codec
- **libjpeg-turbo**, **libpng**: Image processing
- **glib**: Core utilities

Configuration:

- `BASE_OPTS`: Extensive Meson configuration for GStreamer plugins
- `STATIC_OPTS`: Static linking for distribution builds
- `SHARED_OPTS`: Shared libraries for development

### Build Targets

- **`make dev-setup`**: Set up development environment

  - Builds native dependencies with shared libraries
  - Compiles frontend with `pnpm`
  - Generates Go bindings for Rust libraries

- **`make dev`**: Build for development

  - Fast incremental builds
  - Shared library linking
  - Development-friendly configuration

- **`make static`**: Build for production

  - Static linking for portability
  - Optimized builds
  - Embeds frontend in binary

- **`make archive`**: Create distribution archives
  - Cross-platform compilation
  - Generates tarballs for release

### Cross-Compilation

Streamplace supports cross-compilation from Linux to:

- **Linux**: amd64, arm64
- **Windows**: amd64
- **macOS**: amd64, arm64

Uses cross-compilation toolchains defined in `util/*.ini` files.

### Platform-Specific Builds

- **Android**: Gradle-based builds in `js/app/android/`
- **iOS**: Xcode builds in `js/app/ios/`
- **Desktop**: Electron Forge packaging

## Data Flow

### Streaming Ingestion

1. Streamer connects via RTMPS or WebRTC
2. `rtmps` or `media` package receives stream
3. Media is processed by GStreamer pipeline
4. Segments are generated (HLS-compatible)
5. Segments are signed with C2PA metadata
6. `director` manages segment lifecycle
7. Segments stored via `storage` package
8. `bus` notifies interested services
9. `replication` distributes segments via Iroh P2P

### Playback

1. Client requests stream via API
2. `api` package handles request
3. `director` provides M3U8 manifest
4. Client fetches segments from `storage` or peers
5. WebRTC playback uses `media.WebRTCPlayback`
6. HLS playback serves segments over HTTP

### AT Protocol Integration

1. User authenticates via OAuth (AT Protocol DID)
2. Frontend clients publish stream metadata to user's PDS (livestream records,
   chat messages, keys, etc.)
3. `atproto` synchronizer consumes AT Protocol firehose events
4. Records from other users' PDS instances are indexed locally
5. Other AT Protocol clients can discover streams via the firehose

## Key Technologies

### Native Dependencies

- **GStreamer 1.0**: Media processing framework
- **FFmpeg**: Codec support via gst-libav
- **MistServer**: Optional external media server
- **WebRTC**: Real-time communication (Pion library)

### Go Libraries

- **Pion WebRTC**: WebRTC stack in Go
- **httprouter**: HTTP routing
- **indigo**: AT Protocol implementation (Bluesky)
- **oatproxy**: OAuth proxy server

### Rust Libraries

- **Iroh**: P2P networking
- **c2pa-rs**: Content provenance and authenticity
- **uniffi**: Foreign function interface for Go bindings

### TypeScript Libraries

- **Expo**: React Native framework
- **@atproto/api**: AT Protocol client
- **react-native-webrtc**: WebRTC for mobile
- **HLS.js**: HLS playback for web
- **Electron**: Desktop application framework

## Deployment

Streamplace can be deployed as:

- **Standalone binary**: Single executable with embedded frontend
- **Docker container**: Containerized deployment
- **Desktop app**: Electron app for Windows, macOS, Linux
- **Mobile app**: iOS and Android native apps
- **Debian package**: `.deb` packages for apt installation

Distribution artifacts are built via CI/CD (GitLab CI) and published to package
registries.

## Development Workflow

1. **Local development**: `make dev-setup` → `make dev`
2. **Frontend development**: `pnpm run start` (starts dev servers)
3. **Code generation**: `make lexicons` (regenerate from schemas)
4. **Linting**: `make check` (golangci-lint, prettier, TypeScript)
5. **Testing**: `make dev-test` (Go), `pnpm test` (JS)
6. **Formatting**: `make fix` (gofmt, prettier)

## C2PA Integration

Streamplace signs all video segments with C2PA metadata:

- **Algorithm**: ES256K (ECDSA with secp256k1)
- **Claims**: Creator identity, content rights, distribution policy
- **Verification**: Segments can be verified for authenticity
- **Rust integration**: c2pa-rs library handles signing
- **Note**: Not fully C2PA compliant due to ES256K algorithm

## Peer-to-Peer Architecture

Iroh-based P2P system for segment distribution:

- **Discovery**: Local network and static providers
- **Gossip**: Topic-based pub/sub for segment announcements
- **RPC**: Custom protocol for segment requests
- **Go integration**: Rust library exposed to Go via uniffi bindings

## Summary

Streamplace is a complex multi-language system that combines:

- Go backend for media processing and API serving
- TypeScript frontend for cross-platform UIs
- Rust for P2P networking and cryptographic operations
- Native C/C++ libraries for video processing
- AT Protocol for decentralized social networking

The architecture is designed for modularity, with clear separation between media
processing (`media`, `director`), network services (`api`, `atproto`), and
storage/replication layers (`storage`, `replication`, `iroh`). The build system
handles the complexity of compiling and linking multiple languages and native
dependencies into distributable applications.
