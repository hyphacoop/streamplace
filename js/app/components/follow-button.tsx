import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectStreamplace } from "../features/streamplace/streamplaceSlice";
import { followUser, unfollowUser } from "../features/bluesky/blueskySlice";
import { Button, View, Text } from "tamagui";
import { Plus, Check } from "@tamagui/lucide-icons";

/**
 * FollowButton component for following/unfollowing a streamer.
 *
 * Props:
 * - streamerDID: string — The DID of the streamer to follow/unfollow
 * - currentUserDID?: string — The DID of the current user (optional)
 * - onFollowChange?: (isFollowing: boolean) => void — Optional callback when follow state changes
 */
interface FollowButtonProps {
  streamerDID: string;
  currentUserDID?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  streamerDID,
  currentUserDID,
  onFollowChange,
}) => {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followRKey, setFollowRKey] = useState<string | null>(null);
  const { url: streamplaceUrl } = useAppSelector(selectStreamplace);
  const dispatch = useAppDispatch();

  // Hide button if not logged in or viewing own stream
  if (!currentUserDID || currentUserDID === streamerDID) return null;

  // Fetch initial follow state
  useEffect(() => {
    let cancelled = false;

    const fetchFollowStatus = async () => {
      if (!currentUserDID || !streamerDID) return;

      setError(null);
      try {
        const res = await fetch(
          `${streamplaceUrl}/api/following/${currentUserDID}`,
          {
            credentials: "include",
            headers: {
              "X-User-DID": currentUserDID || "",
            },
          },
        );

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch following list: ${errorText}`);
        }

        const data = await res.json();
        if (cancelled) return;

        const following = Array.isArray(data) ? data : [];
        const followRecord = following.find(
          (f: any) => f.SubjectDID === streamerDID,
        );

        if (followRecord) {
          setIsFollowing(true);
          setFollowRKey(followRecord.RKey);
        } else {
          setIsFollowing(false);
          setFollowRKey(null);
        }
      } catch (err) {
        if (!cancelled) setError("Could not determine follow state");
      }
    };

    fetchFollowStatus();
    return () => {
      cancelled = true;
    };
  }, [currentUserDID, streamerDID, streamplaceUrl]);

  const handleFollow = async () => {
    setError(null);
    setIsFollowing(true); // Optimistic
    try {
      const result = await dispatch(followUser(streamerDID)).unwrap();
      setIsFollowing(true);
      setFollowRKey(result.rkey);
      onFollowChange?.(true);
    } catch (err) {
      setIsFollowing(false);
      setError(
        `Failed to follow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleUnfollow = async () => {
    if (!followRKey) {
      setError("Cannot unfollow: missing record key");
      return;
    }

    setError(null);
    setIsFollowing(false); // Optimistic
    try {
      await dispatch(
        unfollowUser({ subjectDID: streamerDID, rkey: followRKey }),
      ).unwrap();
      setIsFollowing(false);
      setFollowRKey(null);
      onFollowChange?.(false);
    } catch (err) {
      setIsFollowing(true);
      setError(
        `Failed to unfollow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      {isFollowing ? (
        <Button
          backgroundColor="transparent"
          onPress={handleUnfollow}
          aria-label="Following"
          icon={Check}
        >
          Following
        </Button>
      ) : (
        <Button
          backgroundColor="transparent"
          onPress={handleFollow}
          aria-label="Follow"
          icon={Plus}
        >
          Follow
        </Button>
      )}
      {error && (
        <Text color="#c00" marginLeft={8}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default FollowButton;
