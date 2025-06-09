import {
  PlayerStatus,
  usePlayerStore,
  useStreamplaceStore,
} from "@streamplace/components";
import React, { useEffect, useState } from "react";

export default function VideoRetry(props: { children: React.ReactNode }) {
  const [resetTime, setResetTime] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);

  const status = usePlayerStore((x) => x.status);
  const playerEvent = usePlayerStore((x) => x.playerEvent);

  const spurl = useStreamplaceStore((x) => x.url);

  const isPlaying = status === PlayerStatus.PLAYING;

  useEffect(() => {
    if (isPlaying) {
      setRetryCount(0);
      return;
    }

    const baseDelay = 3000; // 3 seconds
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

    const handle = setTimeout(() => {
      // console.log(`retrying (attempt ${retryCount + 1}, delay: ${delay}ms)`);
      setResetTime(Date.now());
      setRetryCount((prev) => prev + 1);
      playerEvent(spurl, new Date().toISOString(), "retry", {
        delay,
      });
    }, delay);

    return () => clearTimeout(handle);
  }, [isPlaying, resetTime, retryCount, playerEvent]);

  return <React.Fragment>{props.children}</React.Fragment>;
}
