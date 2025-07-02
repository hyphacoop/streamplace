import { useLivestreamStore } from "../livestream-store";

export function useSegmentDimensions() {
  const latestSegment = useLivestreamStore((x) => x.segment);

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
