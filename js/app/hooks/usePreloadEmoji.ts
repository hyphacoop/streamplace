import React from "react";
import { init } from "emoji-mart";

let loadRequested = false;

export function usePreloadEmoji({ immediate }: { immediate?: boolean } = {}) {
  const preload = React.useCallback(async () => {
    if (loadRequested) return;
    loadRequested = true;
    try {
      const data = (await import("../components/emoji-picker/emoji-data.json"))
        .default;
      init({ data });
    } catch (e) {}
  }, []);

  if (immediate) preload();
  return preload;
}
