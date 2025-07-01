import { useEffect, useRef, useState } from "react";
import { useLivestreamStore } from "../livestream-store";

export function useSegmentDimensions() {
  const latestSegment = useLivestreamStore((x) => x.segment);
  const prevSegmentRef = useRef<typeof latestSegment>();
  const prevRatio = useRef<{ height: number; width: number } | null>(null);

  // Dummy state to force update every second
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // if the latestSegment is different, update the ref
    if (latestSegment && prevSegmentRef.current !== latestSegment) {
      prevSegmentRef.current = latestSegment;
    }
  }, [latestSegment]);

  let seg = latestSegment?.video && latestSegment.video[0];

  let ratio = {
    height: seg?.height || 0,
    width: seg?.width || 0,
  };

  return {
    isPlayerRatioGreater: ratio.width > ratio.height,
    height: ratio.height,
    width: ratio.width,
  };
}
