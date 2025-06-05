import { useContext } from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { PlayerContext } from "./context";
import {
  IngestMediaSource,
  PlayerProtocol,
  PlayerState,
  PlayerStatus,
} from "./player-state";

export type PlayerStore = StoreApi<PlayerState>;

export const makePlayerStore = (id?: string): StoreApi<PlayerState> => {
  return createStore<PlayerState>()((set) => ({
    id: id || Math.random().toString(36).slice(8),
    selectedRendition: "source",
    setSelectedRendition: (rendition: string) =>
      set((state) => ({ ...state, selectedRendition: rendition })),
    protocol: PlayerProtocol.PLAYER_PROTOCOL_WEBRTC,
    setProtocol: (protocol: PlayerProtocol) =>
      set((state) => ({ ...state, protocol: protocol })),

    src: "",
    setSrc: (src: string) => set(() => ({ src })),

    ingestStarting: false,
    setIngestStarting: (ingestStarting: boolean) =>
      set(() => ({ ingestStarting })),

    ingestMediaSource: undefined,
    setIngestMediaSource: (ingestMediaSource: IngestMediaSource | undefined) =>
      set(() => ({ ingestMediaSource })),

    ingestStreamKey: "",
    setIngestStreamKey: (ingestStreamKey: string) =>
      set(() => ({ ingestStreamKey })),

    ingestConnectionState: null,
    setIngestConnectionState: (
      ingestConnectionState: RTCPeerConnectionState | null,
    ) => set(() => ({ ingestConnectionState })),

    ingestAutoStart: false,
    setIngestAutoStart: (ingestAutoStart: boolean) =>
      set(() => ({ ingestAutoStart })),

    ingestStarted: null,
    setIngestStarted: (timestamp: number | null) =>
      set(() => ({ ingestStarted: timestamp })),

    muted: false,
    setMuted: (isMuted: boolean) => set(() => ({ muted: isMuted })),

    volume: 1.0,
    setVolume: (volume: number) => set(() => ({ volume })),

    fullscreen: false,
    setFullscreen: (isFullscreen: boolean) =>
      set(() => ({ fullscreen: isFullscreen })),

    status: PlayerStatus.START,
    setStatus: (status: PlayerStatus) => set(() => ({ status })),

    playTime: 0,
    setPlayTime: (playTime: number) => set(() => ({ playTime })),

    offline: false,
    setOffline: (offline: boolean) => set(() => ({ offline })),

    videoRef: undefined,
    setVideoRef: (
      videoRef:
        | React.MutableRefObject<HTMLVideoElement | null>
        | ((instance: HTMLVideoElement | null) => void)
        | null
        | undefined,
    ) => set(() => ({ videoRef })),

    pipMode: false,
    setPipMode: (pipMode: boolean) => set(() => ({ pipMode })),

    muteWasForced: false,
    setMuteWasForced: (muteWasForced: boolean) =>
      set(() => ({ muteWasForced })),

    embedded: false,
    setEmbedded: (embedded: boolean) => set(() => ({ embedded })),

    showControls: true,
    controlsTimeout: undefined,
    setShowControls: (showControls: boolean) =>
      set({ showControls, controlsTimeout: undefined }),

    playerEvent: async (
      time: string,
      eventType: string,
      meta: { [key: string]: any },
    ) => {
      // just log for now, can be replaced with actual event handling
      console.log(`Player Event: ${eventType} at ${time}`, meta);
    },

    setUserInteraction: () =>
      set((p) => {
        // controls timeout
        if (p.controlsTimeout) {
          clearTimeout(p.controlsTimeout);
        }
        let controlsTimeout = setTimeout(() => p.setShowControls(false), 1000);
        return { showControls: true, controlsTimeout };
      }),
  }));
};

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
}

// Get a specific player store by ID
export function getPlayerStoreById(id: string): PlayerStore {
  const { players } = usePlayerContext();
  const playerStore = players[id];
  if (!playerStore) {
    throw new Error(`No player found with ID: ${id}`);
  }
  return playerStore;
}

// Will get the first player ID in the context
export function getFirstPlayerID(): string {
  const { players } = usePlayerContext();
  const playerIds = Object.keys(players);
  if (playerIds.length === 0) {
    throw new Error("No players found in context");
  }
  return playerIds[0];
}

export function getPlayerStoreFromContext(): PlayerStore {
  console.warn(
    "getPlayerStoreFromContext is deprecated. Use getPlayerStoreById instead.",
  );
  const { players } = usePlayerContext();
  const playerIds = Object.keys(players);
  if (playerIds.length === 0) {
    throw new Error("No players found in context");
  }
  return players[playerIds[0]];
}

// Use a specific player store by ID
// If no ID is provided, it will use the first player in the context
export function usePlayerStore<U>(
  selector: (state: PlayerState) => U,
  playerId?: string,
): U {
  if (!playerId) {
    playerId = Object.keys(usePlayerContext().players)[0];
  }
  const store = getPlayerStoreById(playerId);
  return useStore(store, selector);
}

/* Convenience selectors/hooks */
export const usePlayerProtocol = (
  playerId?: string,
): [PlayerProtocol, (protocol: PlayerProtocol) => void] =>
  usePlayerStore((x) => [x.protocol, x.setProtocol], playerId);

export const intoPlayerProtocol = (protocol: string): PlayerProtocol => {
  switch (protocol) {
    case "hls":
      return PlayerProtocol.PLAYER_PROTOCOL_HLS;
    case "progressive-mp4":
      return PlayerProtocol.PLAYER_PROTOCOL_PROGRESSIVE_MP4;
    case "progressive-webm":
      return PlayerProtocol.PLAYER_PROTOCOL_PROGRESSIVE_WEBM;
    default:
      return PlayerProtocol.PLAYER_PROTOCOL_WEBRTC;
  }
};
