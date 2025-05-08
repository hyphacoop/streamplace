import React from "react";
import { init } from "emoji-mart";

let loadRequested = false;

export function usePreloadEmoji({ immediate }: { immediate?: boolean } = {}) {
  const preload = React.useCallback(async () => {
    if (loadRequested) return;
    loadRequested = true;
    try {
      const res = await fetch("/emoji-data.json");
      const data = await res.json();
      init({ data });
    } catch (e) {}
  }, []);

  if (immediate) preload();
  return preload;
}
