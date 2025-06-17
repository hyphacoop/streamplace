import {
  usePlayerStore,
  useSegment,
  useStreamplaceStore,
} from "@streamplace/components";
import React, { useEffect } from "react";

import { useRef } from "react";

export default function VideoRetry(props: { children: React.ReactNode }) {
  const lastSegmentRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segment = useSegment();

  const status = usePlayerStore((x) => x.status);
  const offline = usePlayerStore((x) => x.offline);
  const spurl = useStreamplaceStore((x) => x.url);

  console.log("Status", status, offline);

  useEffect(() => {
    if (
      lastSegmentRef.current !== null &&
      segment &&
      segment.startTime !== lastSegmentRef.current &&
      offline
    ) {
      const jitter = 500 + Math.random() * 1500;
      retryTimeoutRef.current = setTimeout(() => {
        console.log("Detected new segment and stalled state, retrying video");
        lastSegmentRef.current = segment?.startTime;
      }, jitter);
    }
  }, [offline, segment, spurl]);

  return (
    <React.Fragment key={lastSegmentRef.current}>
      {props.children}
    </React.Fragment>
  );
}
