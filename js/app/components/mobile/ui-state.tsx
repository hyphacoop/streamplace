import { useNavigation } from "@react-navigation/native";
import { useLivestreamStore, usePlayerStore } from "@streamplace/components";
import { createLivestreamRecord } from "features/bluesky/blueskySlice";
import useAvatars from "hooks/useAvatars";
import { useKeyboard } from "hooks/useKeyboard";
import { useOuterAndInnerDimensions } from "hooks/useOuterAndInnerDimensions";
import { useSegmentTiming } from "hooks/useSegmentTiming";
import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import { useAppDispatch } from "store/hooks";

export default function useMobileUiState() {
  const ingest = usePlayerStore((x) => x.ingestConnectionState);
  const profile = useLivestreamStore((x) => x.profile);
  const pHeight = Number(usePlayerStore((x) => x.playerHeight)) || 0;
  const pWidth = Number(usePlayerStore((x) => x.playerWidth)) || 0;
  const ingestCamera = usePlayerStore((x) => x.ingestCamera);
  const setIngestCamera = usePlayerStore((x) => x.setIngestCamera);
  const { width, height } = Dimensions.get("window");

  const [title, setTitle] = useState<string | undefined>();
  const [showMetrics, setShowMetrics] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [recordSubmitted, setRecordSubmitted] = useState(false);

  const navigation = useNavigation();
  const avatars = useAvatars(profile ? [profile?.did] : []);

  const isPlayerRatioGreater = pWidth / pHeight > width / height;
  const isSelfAndNotLive = ingest === "new";
  const isLive = ingest !== null && ingest !== "new";

  const ingestStarting = usePlayerStore((x) => x.ingestStarting);
  const setIngestStarting = usePlayerStore((x) => x.setIngestStarting);

  const dispatch = useAppDispatch();

  const { keyboardHeight } = useKeyboard();
  let { outerHeight, innerHeight } = useOuterAndInnerDimensions();
  let slideKeyboard = 0;
  if (Platform.OS === "ios" && keyboardHeight > 0) {
    slideKeyboard = -keyboardHeight + (outerHeight - innerHeight);
  }

  const { segmentDeltas, mean, range, connectionQuality } = useSegmentTiming();

  const handleSubmit = async () => {
    try {
      if (title) {
        // wait ~2 sec for the thumbnail to propogate
        setTimeout(() => {
          dispatch(
            createLivestreamRecord({
              title,
              customThumbnail: undefined, // thumbnailToUse || undefined,
            }),
          ),
            setRecordSubmitted(true);
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating livestream:", error);
    } finally {
      setRecordSubmitted(false);
    }
  };

  const toggleGoLive = () => {
    if (!ingestStarting) {
      // if keyboard is open, close it
      if (Platform.OS === "ios" && keyboardHeight > 0) {
        Keyboard.dismiss();
      }
      setShowCountdown(true);
      setIngestStarting(true);
      handleSubmit();
      return;
    }
    setIngestStarting(false);
  };

  useEffect(() => {
    return () => {
      if (ingestStarting) {
        setIngestStarting(false);
      }
    };
  }, []);

  const doSetIngestCamera = () => {
    setIngestCamera(ingestCamera === "user" ? "environment" : "user");
  };

  return {
    ingest,
    profile,
    width,
    height,
    title,
    setTitle,
    showCountdown,
    setShowCountdown,
    recordSubmitted,
    setRecordSubmitted,
    avatars,
    isPlayerRatioGreater,
    isSelfAndNotLive,
    isLive,
    ingestStarting,
    slideKeyboard,
    segmentDeltas,
    mean,
    range,
    connectionQuality,
    toggleGoLive,
    doSetIngestCamera,
    navigation,
  };
}
