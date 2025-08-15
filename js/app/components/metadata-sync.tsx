import { useStreamplaceStore } from "@streamplace/components";
import { updateMultipleMetadataFromPoller } from "features/bluesky/contentMetadataSlice";
import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch } from "store/hooks";

// This component bridges the gap between streamplace store and Redux metadata store
// It listens to changes in liveUsersMetadata from the poller and updates the Redux cache
export default function MetadataSync() {
  const dispatch = useAppDispatch();
  const liveUsers = useStreamplaceStore((state) => state.liveUsers);
  const liveUsersMetadata = useStreamplaceStore(
    (state) => state.liveUsersMetadata,
  );
  const lastUpdatesRef = useRef<{ [key: string]: any }>({});

  // Memoize the metadata updates to prevent unnecessary dispatches
  const metadataUpdates = useMemo(() => {
    if (liveUsers === null) return null;

    const updates: { [key: string]: any } = {};

    // Only add metadata for users that are currently live
    if (
      liveUsers.length > 0 &&
      liveUsersMetadata &&
      liveUsers.length === liveUsersMetadata.length
    ) {
      for (let i = 0; i < liveUsers.length; i++) {
        const user = liveUsers[i];
        const metadata = liveUsersMetadata[i];

        if (user && user.author && user.author.did) {
          // Extract the metadata value from the LexiconTypeDecoder if it exists
          const metadataValue = metadata?.val || metadata;
          updates[user.author.did] = metadataValue;
        }
      }
    }

    return updates;
  }, [liveUsers, liveUsersMetadata]);

  useEffect(() => {
    if (metadataUpdates === null) return;

    // Only dispatch if the metadata has actually changed
    const hasChanged =
      JSON.stringify(metadataUpdates) !==
      JSON.stringify(lastUpdatesRef.current);

    if (hasChanged) {
      console.log(
        "MetadataSync: Syncing metadata cache for",
        Object.keys(metadataUpdates).length,
        "live users:",
        metadataUpdates,
      );
      lastUpdatesRef.current = metadataUpdates;
      dispatch(updateMultipleMetadataFromPoller(metadataUpdates));
    }
  }, [metadataUpdates, dispatch]);

  // This component doesn't render anything, it just syncs data
  return null;
}
