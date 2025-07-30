import { useContext, useEffect, useState } from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { LivestreamContext } from "./context";
import { LivestreamState } from "./livestream-state";
import { handleWebSocketMessages } from "./websocket-consumer";

export type LivestreamStore = StoreApi<LivestreamState>;

export const makeLivestreamStore = (): StoreApi<LivestreamState> => {
  return createStore<LivestreamState>()((set) => ({
    profile: null,
    chatIndex: {},
    chat: [],
    livestream: null,
    viewers: null,
    pendingHides: [],
    segment: null,
    renditions: [],
    replyToMessage: null,
    streamKey: null,
    setStreamKey: (sk) => set({ streamKey: sk }),
    authors: {},
  }));
};

export function getStoreFromContext(): LivestreamStore {
  const context = useContext(LivestreamContext);
  if (!context) {
    throw new Error(
      "useLivestreamStore must be used within a LivestreamProvider",
    );
  }
  return context.store;
}

export function useLivestreamStore<U>(
  selector: (state: LivestreamState) => U,
): U {
  const store = getStoreFromContext();
  return useStore(store, selector);
}

export const useHandleWebsocketMessages = () => {
  const store = getStoreFromContext();
  return (messages: any[]) => {
    store.setState((state) => handleWebSocketMessages(state, messages));
  };
};

export const useChat = () => useLivestreamStore((x) => x.chat);

export const useProfile = () => useLivestreamStore((x) => x.profile);

export const useViewers = () => useLivestreamStore((x) => x.viewers);

export const useLivestream = () => useLivestreamStore((x) => x.livestream);

export const useSegment = () => useLivestreamStore((x) => x.segment);

export const useRenditions = () => useLivestreamStore((x) => x.renditions);

// returns true if the livestream has been offline for more than 10 seconds
export const useOffline = () => {
  const segment = useLivestreamStore((x) => x.segment);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);
  if (!segment?.startTime) {
    return false;
  }
  return now - Date.parse(segment.startTime) > 10000;
};
