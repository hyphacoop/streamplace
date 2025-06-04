import { useContext } from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { shallow } from "zustand/shallow"; // Import shallow
import { PlayerContext } from "./context";
import { PlayerProtocol, PlayerState } from "./player-state";
export type PlayerStore = StoreApi<PlayerState>;

export const makePlayerStore = (): StoreApi<PlayerState> => {
  return createStore<PlayerState>()((set) => ({
    id: Math.random().toString(36).slice(8),
    selectedRendition: "auto",
    setSelectedRendition: (rendition: string) =>
      set((state) => ({ ...state, selectedRendition: rendition })),
    protocol: PlayerProtocol.PLAYER_PROTOCOL_WEBRTC,
    setProtocol: (protocol: PlayerProtocol) =>
      set((state) => ({ ...state, protocol: protocol })),

    ingestStarting: false,
    setIngestStarting: (ingestStarting: boolean) =>
      set(() => ({ ingestStarting })),

    ingestConnectionState: null,
    setIngestConnectionState: (
      ingestConnectionState: RTCPeerConnectionState | null,
    ) => set(() => ({ ingestConnectionState })),

    ingestStarted: null,
    setIngestStarted: (timestamp: number | null) =>
      set(() => ({ ingestStarted: timestamp })),
  }));
};

export function getPlayerStoreFromContext(): PlayerStore {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error(
      "getPlayerStoreFromContext must be used within a PlayerProvider",
    );
  }
  return context.store;
}

export function usePlayerStore<U>(
  selector: (state: PlayerState) => U,
  equals?: (a: U, b: U) => boolean,
): U {
  const store = getPlayerStoreFromContext();
  return useStore(store, selector); // Pass equality function
}

/* Convenience selectors/hooks */
export const usePlayerProtocol = (): [
  PlayerProtocol,
  (protocol: PlayerProtocol) => void,
] => usePlayerStore((x) => [x.protocol, x.setProtocol], shallow); // Use shallow comparison

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

export const usePlayerSelectedRendition = (): [
  string,
  (rendition: string) => void,
] =>
  usePlayerStore((x) => [x.selectedRendition, x.setSelectedRendition], shallow); // Also apply shallow here if it returns an array/object

export const usePlayerId = () => usePlayerStore((x) => x.id); // No shallow needed for primitive
