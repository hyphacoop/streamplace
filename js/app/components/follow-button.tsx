import { Text, zero } from "@streamplace/components";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { followUser, unfollowUser } from "../features/bluesky/blueskySlice";
import { selectStreamplace } from "../features/streamplace/streamplaceSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

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
  const [followUri, setFollowUri] = useState<string | null>(null);
  const { url: streamplaceUrl } = useAppSelector(selectStreamplace);
  const dispatch = useAppDispatch();

  // Hide button if not logged in or viewing own stream
  if (!currentUserDID || currentUserDID === streamerDID) return null;

  // Fetch initial follow state using xrpc
  useEffect(() => {
    let cancelled = false;

    const fetchFollowStatus = async () => {
      if (!currentUserDID || !streamerDID) return;

      setError(null);
      try {
        const res = await fetch(
          `${streamplaceUrl}/xrpc/place.stream.graph.getFollowingUser?subjectDID=${encodeURIComponent(streamerDID)}&userDID=${encodeURIComponent(currentUserDID)}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch follow status: ${errorText}`);
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.follow) {
          setIsFollowing(true);
          setFollowUri(data.follow.uri);
        } else {
          setIsFollowing(false);
          setFollowUri(null);
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
      await dispatch(followUser(streamerDID)).unwrap();
      setIsFollowing(true);
      onFollowChange?.(true);
    } catch (err) {
      setIsFollowing(false);
      setError(
        `Failed to follow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleUnfollow = async () => {
    setError(null);
    setIsFollowing(false); // Optimistic
    try {
      await dispatch(
        unfollowUser({
          subjectDID: streamerDID,
          ...(followUri ? { followUri } : {}),
        }),
      ).unwrap();
      setIsFollowing(false);
      setFollowUri(null);
      onFollowChange?.(false);
    } catch (err) {
      setIsFollowing(true);
      setError(
        `Failed to unfollow: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const buttonStyle = [
    zero.bg.transparent,
    zero.px[3],
    zero.py[2],
    zero.r.md,
    zero.borders.width.thin,
    zero.borders.color.gray[300],
  ];

  return (
    <View
      style={[
        { flexDirection: "row" },
        { alignItems: "center" },
        zero.gap.all[2],
      ]}
    >
      {isFollowing === null ? (
        // Skeleton loader to prevent layout shift
        <Pressable style={[...buttonStyle, { opacity: 0.5 }]} disabled>
          <Text>&nbsp;</Text>
        </Pressable>
      ) : isFollowing ? (
        <Pressable
          style={buttonStyle}
          onPress={handleUnfollow}
          accessibilityLabel="Following"
        >
          <View
            style={[
              { flexDirection: "row" },
              { alignItems: "center" },
              zero.gap.all[1],
            ]}
          >
            <Text>✓</Text>
            <Text>Following</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          style={buttonStyle}
          onPress={handleFollow}
          accessibilityLabel="Follow"
        >
          <View
            style={[
              { flexDirection: "row" },
              { alignItems: "center" },
              zero.gap.all[1],
            ]}
          >
            <Text>+</Text>
            <Text>Follow</Text>
          </View>
        </Pressable>
      )}
      {error && <Text style={[{ color: "#c00" }, zero.ml[2]]}>{error}</Text>}
    </View>
  );
};

export default FollowButton;
