import {
  usePlayerStore,
  useSegment,
  useStreamplaceStore,
} from "@streamplace/components";
import React, { useEffect } from "react";

import { useRef } from "react";

export default function VideoRetry(props: { children: React.ReactNode }) {
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // last segment start time
  let [lastSegST, setLastSegST] = React.useState<string | null>(null);
  const segment = useSegment();

  const offline = usePlayerStore((x) => x.offline);
  const spurl = useStreamplaceStore((x) => x.url);

  useEffect(() => {
    if (
      lastSegST !== null &&
      segment &&
      segment.startTime !== lastSegST &&
      offline
    ) {
      console.log("Timeout detected!");
      const jitter = 500 + Math.random() * 1500;
      retryTimeoutRef.current = setTimeout(() => {
        console.log("Retrying video segment", segment.startTime);
        setLastSegST(segment.startTime);
      }, jitter);
    }
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [offline, segment, spurl, lastSegST]);

  return <React.Fragment key={lastSegST}>{props.children}</React.Fragment>;
}
