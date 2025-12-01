# Streamplace Architecture Description

This document describes the component architecture of Streamplace in plain language, suitable for creating architecture diagrams.

## System Overview

Streamplace is a hybrid monolith-microservices architecture for live video streaming with decentralized social networking features. It consists of:
- A Go backend monolith with modular internal packages
- TypeScript/React Native frontends (web, mobile, desktop)
- A Rust P2P networking layer for efficient segment distribution
- Integration with the AT Protocol for decentralized identity and social features

## Component Layers

### Layer 1: Frontend Applications (TypeScript/React Native)

**Location**: `js/`

#### Components:

1. **Web Application** (`js/app/`)
   - React Native web app built with Expo
   - Connects to: API Service (HTTP/XRPC/WebSocket)
   - Uses: Streamplace API Client library
   - Features: Video streaming, authentication, social features

2. **iOS Application** (`js/app/`)
   - Native iOS app built with Expo
   - Connects to: API Service (HTTP/XRPC/WebSocket)
   - Uses: Streamplace API Client library, native WebRTC
   - Features: Mobile streaming, push notifications

3. **Android Application** (`js/app/`)
   - Native Android app built with Expo
   - Connects to: API Service (HTTP/XRPC/WebSocket)
   - Uses: Streamplace API Client library, native WebRTC
   - Features: Mobile streaming, push notifications

4. **Desktop Application** (`js/desktop/`)
   - Electron wrapper application
   - Embeds: Go Backend (spawns as child process)
   - Connects to: Embedded API Service (localhost)
   - Features: Standalone installation, local server

#### Shared Libraries:

5. **Streamplace API Client** (`js/streamplace/`)
   - Auto-generated from Lexicons
   - Used by: All frontend applications
   - Provides: Type-safe API calls to backend

6. **Shared Components** (`js/components/`)
   - Used by: All React Native apps
   - Provides: Video players, UI components

7. **AT Protocol OAuth Client** (`js/atproto-oauth-client-react-native/`)
   - Used by: All frontend applications
   - Connects to: OAuth Provider (via oatproxy)
   - Provides: Authentication flows

### Layer 2: API and Web Service (Go)

**Location**: `pkg/api/`

#### Components:

8. **API Service** (`pkg/api/api.go`)
   - Entry point for all HTTP/HTTPS requests
   - Connects to: Director, SPXRPC Server, Media Manager, Model, StateDB
   - Serves: Frontend applications (static files)
   - Provides: REST/XRPC endpoints, WebSocket connections
   - Features: OAuth via oatproxy, rate limiting, CORS, metrics

9. **WebSocket Handler** (`pkg/api/websocket.go`)
   - Part of: API Service
   - Connects to: Bus (subscribes to events)
   - Provides: Real-time updates to clients
   - Features: Viewer presence, chat, notifications

10. **SPXRPC Server** (`pkg/spxrpc/`)
    - Auto-generated from Lexicons
    - Used by: API Service
    - Connects to: Model, Director, Media Manager
    - Provides: AT Protocol-compatible RPC endpoints

11. **OAuth Proxy (oatproxy)** (`github.com/streamplace/oatproxy`)
    - External library embedded in API Service
    - Connects to: AT Protocol OAuth Provider, StateDB
    - Provides: Authentication, session management

### Layer 3: Stream Management (Go)

**Location**: `pkg/director/`

#### Components:

12. **Director** (`pkg/director/director.go`)
    - Manages: Stream Sessions (lifecycle)
    - Connects to: Media Manager, Bus, Replicator, Model
    - Subscribes to: Bus (segment notifications)
    - Provides: Stream coordination, session tracking

13. **Stream Session** (`pkg/director/stream_session.go`)
    - Managed by: Director
    - Connects to: Media Manager, Replicator
    - Provides: Per-stream state management
    - Features: Transcoding decisions, segment routing

### Layer 4: Media Processing (Go)

**Location**: `pkg/media/`

#### Components:

14. **Media Manager** (`pkg/media/media.go`)
    - Core media processing service
    - Connects to: GStreamer (external), Media Signer, Storage, Bus
    - Used by: Director, API Service, RTMPS Server
    - Provides: Video/audio processing, segmentation

15. **WebRTC Ingestion** (`pkg/media/webrtc_ingest.go`)
    - Part of: Media Manager
    - Receives: WebRTC streams from clients
    - Connects to: Media Manager pipeline
    - Uses: Pion WebRTC library

16. **WebRTC Playback** (`pkg/media/webrtc_playback2.go`)
    - Part of: Media Manager
    - Sends: WebRTC streams to clients
    - Connects to: Media Manager, Storage
    - Uses: Pion WebRTC library

17. **HLS Segmenter** (`pkg/media/segmenter.go`)
    - Part of: Media Manager
    - Connects to: GStreamer, Storage
    - Produces: HLS-compatible segments (.ts files), M3U8 manifests
    - Publishes to: Bus (segment notifications)

18. **Media Signer** (`pkg/media/`)
    - Connects to: Iroh Streamplace (via FFI), Crypto
    - Provides: C2PA metadata signing
    - Used by: Media Manager

19. **RTMPS Server** (`pkg/rtmps/`)
    - Standalone ingestion service
    - Connects to: Media Manager
    - Provides: Secure RTMP ingestion endpoint
    - Features: Stream key validation

### Layer 5: AT Protocol Integration (Go)

**Location**: `pkg/atproto/`

#### Components:

20. **AT Protocol Synchronizer** (`pkg/atproto/atproto.go`)
    - Connects to: AT Protocol Network (PDS, AppView, Firehose)
    - Writes to: Model
    - Publishes to: Bus
    - Provides: Identity resolution, authentication

21. **Firehose Consumer** (`pkg/atproto/firehose.go`)
    - Part of: AT Protocol Synchronizer
    - Connects to: AT Protocol Firehose (WebSocket)
    - Processes: Real-time network events
    - Writes to: Model

22. **Lexicon Repository** (`pkg/atproto/lexicon_repo.go`)
    - Part of: AT Protocol Synchronizer
    - Manages: User repositories, record publishing
    - Connects to: PDS instances

23. **Labeler** (`pkg/atproto/`)
    - Part of: AT Protocol Synchronizer
    - Provides: Content moderation labels
    - Connects to: AT Protocol Network

### Layer 6: Data Storage (Go)

**Location**: `pkg/model/`, `pkg/statedb/`, `pkg/storage/`

#### Components:

24. **Model (Database)** (`pkg/model/model.go`)
    - ORM layer using GORM
    - Connects to: SQLite or PostgreSQL
    - Stores: Streams, users, segments, chat, follows, livestreams, AT Protocol records
    - Used by: API Service, SPXRPC Server, Director, AT Proto Synchronizer

25. **StateDB** (`pkg/statedb/statedb.go`)
    - Separate stateful database
    - Connects to: SQLite or PostgreSQL
    - Stores: OAuth sessions, notifications, webhooks, tasks, queues
    - Used by: API Service, Notifications

26. **Storage Layer** (`pkg/storage/`)
    - Storage abstraction
    - Backends: Local filesystem, S3-compatible storage
    - Stores: Video segments, thumbnails
    - Used by: Media Manager, API Service

### Layer 7: Internal Communication (Go)

**Location**: `pkg/bus/`

#### Components:

27. **Message Bus** (`pkg/bus/bus.go`)
    - Internal pub/sub system
    - Publishers: Media Manager, Director, AT Proto Synchronizer
    - Subscribers: Director, WebSocket Handler, Replicator
    - Events: Segment notifications, viewer counts, stream state changes

### Layer 8: Replication and P2P (Go + Rust)

**Location**: `pkg/replication/`, `rust/iroh-streamplace/`

#### Components:

28. **Replicator Interface** (`pkg/replication/replicator.go`)
    - Abstract interface for segment distribution
    - Implementations: Iroh Replicator, WebSocket Replicator
    - Used by: Director
    - Subscribes to: Bus (segment notifications)

29. **Iroh Replicator** (`pkg/replication/iroh_replicator/iroh.go`)
    - Go wrapper for Rust Iroh library
    - Connects to: Iroh Streamplace (via FFI), Storage
    - Provides: P2P segment distribution
    - Features: Gossip protocol, RPC layer

30. **WebSocket Replicator** (`pkg/replication/websocketrep/websocket_replicator.go`)
    - Fallback replication method
    - Connects to: Other Streamplace nodes (WebSocket)
    - Provides: Server-to-server segment distribution

31. **Iroh Streamplace (Rust)** (`rust/iroh-streamplace/`)
    - P2P networking library
    - Uses: Iroh (QUIC-based networking)
    - Provides: Gossip protocol for segment availability, RPC for retrieval
    - Features: C2PA signing integration
    - Exposes to Go via: uniffi FFI

32. **Iroh Go Bindings** (`pkg/iroh/`)
    - Auto-generated FFI bindings
    - Generated from: Rust Iroh Streamplace
    - Used by: Iroh Replicator, Media Signer
    - Technology: uniffi-bindgen-go

### Layer 9: Supporting Services (Go)

**Location**: Various `pkg/` subdirectories

#### Components:

33. **Crypto Service** (`pkg/crypto/`)
    - Provides: EIP712 signing, ES256K algorithm
    - Used by: Media Signer, AT Proto integration
    - Features: Key management, secp256k1

34. **Notifications Service** (`pkg/notifications/`)
    - Connects to: Firebase Cloud Messaging
    - Reads from: StateDB
    - Provides: Push notifications to mobile apps

35. **Integrations Service** (`pkg/integrations/`)
    - Connects to: Livepeer Network (optional)
    - Provides: External transcoding, webhooks

36. **Thumbnail Generator** (`pkg/thumbnail/`)
    - Part of: Media Manager
    - Connects to: GStreamer
    - Provides: Frame extraction, preview images

37. **Renditions Manager** (`pkg/renditions/`)
    - Part of: Media Manager
    - Provides: Multi-bitrate encoding, ABR

38. **WebRTC Recorder** (`pkg/rtcrec/`)
    - Connects to: Media Manager
    - Provides: Stream archival to disk

39. **MistServer Integration** (`pkg/mist/`)
    - Optional external media server
    - Alternative to: Built-in RTMPS Server
    - Provides: RTMP/RTMPS ingestion

40. **Logging & Metrics** (`pkg/log/`, `pkg/spmetrics/`)
    - Used by: All Go components
    - Provides: Structured logging, Prometheus metrics

### Layer 10: External Systems

#### Components:

41. **AT Protocol Network** (External)
    - Components: PDS (Personal Data Server), AppView, Firehose, OAuth Provider
    - Connected by: AT Protocol Synchronizer, OAuth Proxy
    - Provides: Decentralized identity, social graph, authentication

42. **GStreamer** (External native library)
    - Used by: Media Manager
    - Provides: Video/audio processing pipeline
    - Built via: Meson (subprojects/)

43. **Firebase Cloud Messaging** (External service)
    - Connected by: Notifications Service
    - Provides: Push notification delivery

44. **Livepeer Network** (Optional external service)
    - Connected by: Integrations Service
    - Provides: Distributed transcoding

45. **STUN/TURN Servers** (External service)
    - Used by: WebRTC Ingestion, WebRTC Playback
    - Provides: NAT traversal for WebRTC

46. **PostgreSQL/SQLite** (External database)
    - Connected by: Model, StateDB (via GORM)
    - Provides: Persistent data storage

## Data Flow Diagrams

### Stream Ingestion Flow

```
User (RTMPS client or WebRTC browser)
  → RTMPS Server OR WebRTC Ingestion
  → Media Manager (GStreamer pipeline)
  → HLS Segmenter (creates .ts segments)
  → Media Signer (adds C2PA signatures via Iroh FFI)
  → Storage Layer (saves to disk/S3)
  → Bus (publishes "new segment" event)
  → Director (receives notification, updates session)
  → Iroh Replicator (distributes via P2P)
  → Peer nodes
```

### Stream Playback Flow

```
Client (Web/Mobile app)
  → API Service (HTTP request for stream)
  → SPXRPC Server OR API handler
  → Director (get stream session)
  → Media Manager (generate M3U8 manifest OR WebRTC offer)
  → Client receives:
      - HLS: Downloads segments via HTTP from Storage
      - WebRTC: Direct connection via WebRTC Playback
  → Bus (tracks viewer count)
```

### AT Protocol Social Flow

```
User (via Frontend app)
  → OAuth Proxy (authenticate)
  → AT Protocol OAuth Provider
  → OAuth Proxy (store session in StateDB)
  → API Service (user publishes livestream record)
  → SPXRPC Server
  → Lexicon Repository (publish to user's PDS)
  → AT Protocol Network (firehose)
  → Firehose Consumer (subscribes to events)
  → Model (save to database)
  → Bus (notify subscribers)
  → WebSocket Handler (push to connected clients)
```

### P2P Segment Distribution Flow

```
Media Manager (new segment created)
  → Storage Layer (save segment)
  → Bus (publish "new segment")
  → Iroh Replicator (receives notification)
  → Iroh Streamplace Rust (via FFI)
  → Gossip protocol (announce segment availability)
  → Peer nodes (discover via gossip)
  → Peer requests segment via RPC
  → Iroh Streamplace Rust (serve segment)
  → Peer receives segment
```

## Component Relationships

### Direct Dependencies (A uses B):

- API Service uses: Director, SPXRPC Server, Media Manager, Model, StateDB, OAuth Proxy
- Director uses: Media Manager, Bus, Replicator, Model
- Media Manager uses: GStreamer, Storage, Bus, Media Signer
- SPXRPC Server uses: Model, Director, Media Manager
- AT Protocol Synchronizer uses: AT Protocol Network, Model, Bus
- Iroh Replicator uses: Iroh Streamplace (FFI), Storage
- WebSocket Handler uses: Bus
- OAuth Proxy uses: AT Protocol OAuth Provider, StateDB
- Notifications Service uses: Firebase Cloud Messaging, StateDB
- All components use: Logging & Metrics

### Pub/Sub via Bus:

Publishers:
- Media Manager (segment events)
- Director (stream state)
- AT Protocol Synchronizer (network events)

Subscribers:
- Director (segment notifications)
- WebSocket Handler (all events for clients)
- Iroh Replicator (segment notifications)

### FFI Boundaries:

- Go ↔ Rust: Iroh Go Bindings ↔ Iroh Streamplace
- Go ↔ C: Media Manager ↔ GStreamer

### Process Boundaries:

- Desktop App (Electron) spawns Backend (Go binary)
- Backend optionally spawns Livepeer node

## Technology Stack Summary

### Backend (Go):
- Web framework: Echo
- WebRTC: Pion
- Database: GORM (SQLite/PostgreSQL)
- AT Protocol: @bluesky-social/indigo
- Media: go-gst (GStreamer bindings)

### Frontend (TypeScript):
- Framework: React Native + Expo
- AT Protocol: @atproto/api
- WebRTC: react-native-webrtc
- HLS: hls.js (web), expo-video (mobile)
- State: Zustand
- Desktop: Electron

### P2P (Rust):
- Networking: Iroh
- Signing: c2pa-rs
- FFI: uniffi

### Native (C/C++):
- Media: GStreamer, FFmpeg
- Codecs: x264, fdk-aac, opus
- Build: Meson + Ninja

## Deployment Architectures

### Standalone Server Mode:
```
Single Go Binary
  ├── API Service (serves frontend)
  ├── All backend services
  └── Embedded frontend static files
```

### Desktop Application Mode:
```
Electron App
  └── Spawns Go Binary (localhost)
      ├── API Service
      └── All backend services
```

### Mobile Application Mode:
```
Native App (iOS/Android)
  └── Connects to remote API Service
      └── Full backend stack on server
```

### Multi-Node P2P Mode:
```
Node 1                    Node 2                    Node 3
├── Full backend          ├── Full backend          ├── Full backend
├── Iroh Replicator       ├── Iroh Replicator       ├── Iroh Replicator
└── P2P connections ←─────┼────────────────────────→ └── P2P connections
                          └─────────────────────────→
```

## Configuration and Build

### Lexicon-Based Code Generation:
```
Lexicon Schemas (JSON)
  ├── make lexgen → Go code (pkg/spxrpc/, pkg/streamplace/)
  ├── make js-lexicons → TypeScript code (js/streamplace/src/lexicons/)
  └── make md-lexicons → Markdown docs
```

### Build Pipeline:
```
Native Dependencies
  └── Meson build (subprojects/) → GStreamer, FFmpeg, etc.

Go Backend
  └── go build → streamplace binary

Rust P2P
  └── cargo build → libironoh_streamplace.a/.so
      └── uniffi-bindgen-go → Go bindings (pkg/iroh/generated/)

Frontend
  ├── pnpm build (web) → Static files
  ├── expo build (mobile) → iOS/Android apps
  └── electron-forge (desktop) → Electron app
```

## Key Architectural Patterns

1. **Monolith with Internal Modularity**: Single Go binary with well-isolated packages
2. **Pub/Sub via Message Bus**: Loose coupling between services
3. **FFI for Performance**: Rust for P2P, C for media processing
4. **Protocol-Driven Design**: Lexicons define API contracts
5. **Hybrid Centralized/P2P**: Centralized API + P2P distribution
6. **Multi-Platform Frontend**: Single React Native codebase
7. **Embedded Backend**: Desktop app includes server
8. **AT Protocol Integration**: Decentralized social layer
