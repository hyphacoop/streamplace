import { usePDSAgent } from "@streamplace/components";
import { selectUserProfile } from "features/bluesky/blueskySlice";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

interface LivestreamMetadata {
  contentWarnings: string[];
  createdAt: string;
  distributionPolicy?: {
    allowArchive: boolean;
    broadcastExpiry?: string; // Make this optional
  };
  contentRights?: {
    attribution?: string;
    license?: string;
    usageTerms?: string;
    year?: string;
  };
}

export function useLivestreamMetadata(streamerDid?: string) {
  const userProfile = useAppSelector(selectUserProfile);
  const pdsAgent = usePDSAgent();
  const [metadata, setMetadata] = useState<LivestreamMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the provided streamerDid, or fall back to the current user's DID
  const targetDid = streamerDid || userProfile?.did;

  // Check if we're fetching the current user's metadata (can create if missing)
  const isCurrentUser = !streamerDid && userProfile?.did === targetDid;

  useEffect(() => {
    if (!pdsAgent || !targetDid) {
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch the target user's metadata record (singleton)
        const result = await pdsAgent.com.atproto.repo.getRecord({
          repo: targetDid,
          collection: "place.stream.default.metadata",
          rkey: "self",
        });

        if (result.success && result.data.value) {
          const metadataValue = result.data.value as any;
          setMetadata({
            contentWarnings: metadataValue.contentWarnings || [],
            createdAt: metadataValue.createdAt,
            distributionPolicy: metadataValue.distributionPolicy,
            contentRights: metadataValue.contentRights,
          });
        } else {
          // No metadata record found
          setMetadata(null);
        }
      } catch (err) {
        // Handle "record not found" as a normal case - user hasn't created metadata yet
        if (
          err instanceof Error &&
          (err.message.includes("not found") ||
            err.message.includes("mst: not found") ||
            err.message.includes("RecordNotFound"))
        ) {
          // If this is the current user's metadata and it doesn't exist, create it
          if (isCurrentUser) {
            try {
              const defaultMetadataRecord = {
                $type: "place.stream.default.metadata",
                createdAt: new Date().toISOString(),
                contentWarnings: [],
                distributionPolicy: {
                  allowArchive: true,
                  broadcastExpiry: undefined, // No expiration means forever
                },
                contentRights: {},
              };

              await pdsAgent.com.atproto.repo.createRecord({
                repo: targetDid,
                collection: "place.stream.default.metadata",
                rkey: "self",
                record: defaultMetadataRecord,
              });

              // Set the created metadata
              setMetadata({
                contentWarnings: [],
                createdAt: defaultMetadataRecord.createdAt,
                distributionPolicy: defaultMetadataRecord.distributionPolicy,
                contentRights: defaultMetadataRecord.contentRights,
              });
              setError(null);
            } catch (createErr) {
              console.error(
                "Failed to create default metadata record:",
                createErr,
              );
              setMetadata(null);
              setError(null); // Don't show error for missing metadata
            }
          } else {
            // For other users, just set metadata to null (they haven't created one)
            setMetadata(null);
            setError(null);
          }
        } else {
          console.error("Failed to fetch livestream metadata:", err);
          setError(
            err instanceof Error ? err.message : "Failed to fetch metadata",
          );
          setMetadata(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [pdsAgent, targetDid]); // Use targetDid instead of userProfile?.did

  return {
    metadata,
    loading,
    error,
    hasWarnings:
      metadata?.contentWarnings && metadata.contentWarnings.length > 0,
    warnings: metadata?.contentWarnings || [],
  };
}
