#!/bin/bash

set -euo pipefail

upstream="${1:-"wss://bsky.network"}"
echo "listening on port 8765"

websocat --binary -E ws-l:0.0.0.0:8765 $upstream/xrpc/com.atproto.sync.subscribeRepos