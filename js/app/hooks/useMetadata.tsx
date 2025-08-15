import {
  getMultipleMetadata,
  selectCachedMetadata,
} from "features/bluesky/contentMetadataSlice";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

// Following the exact same pattern as useAvatars - just initial fetch, no polling
// Live updates will come from getLiveUsers API just like titles and viewer counts
export default function useMetadata(dids: string[]) {
  const dispatch = useAppDispatch();
  const metadata: Record<string, any> = useAppSelector(selectCachedMetadata);

  const missingDids = useMemo(
    () => dids.filter((did) => !(did in metadata)),
    [dids, metadata],
  );

  // Initial fetch for missing DIDs only
  useEffect(() => {
    if (missingDids.length > 0) {
      console.log("Fetching metadata for DIDs:", missingDids);
      dispatch(getMultipleMetadata(missingDids)).then((e) =>
        console.log("metadata ok", e),
      );
    }
  }, [missingDids, dispatch]);

  return metadata;
}
