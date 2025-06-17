import { useNavigation } from "@react-navigation/native";
import { useLivestreamStore, usePlayerStore } from "@streamplace/components";
import { Text, Toast, View } from "@streamplace/components/src/components/ui";
import { layout } from "@streamplace/components/src/lib/theme";
import {
  borders,
  colors,
  gap,
  h,
  position,
  w,
} from "@streamplace/components/src/lib/theme/atoms";
import { createLivestreamRecord } from "features/bluesky/blueskySlice";
import useAvatars from "hooks/useAvatars";
import { useKeyboard } from "hooks/useKeyboard";
import { useOuterAndInnerDimensions } from "hooks/useOuterAndInnerDimensions";
import { useSegmentTiming } from "hooks/useSegmentTiming";
import { ChevronLeft, SwitchCamera } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Dimensions, Image, Keyboard, Platform, Pressable } from "react-native";
import { useAppDispatch } from "store/hooks";
import { ChatPanel } from "./ui/chat";
import { CountdownOverlay } from "./ui/countdown";
import { InputPanel } from "./ui/input";
import { MetricsPanel } from "./ui/metrics";
import ViewerContextMenu from "./ui/viewer-context-menu";

// Dropdown imports

export function MobileUi() {
  const ingest = usePlayerStore((x) => x.ingestConnectionState);
  const profile = useLivestreamStore((x) => x.profile);
  const pHeight = Number(usePlayerStore((x) => x.playerHeight)) || 0;
  const pWidth = Number(usePlayerStore((x) => x.playerWidth)) || 0;
  const ingestCamera = usePlayerStore((x) => x.ingestCamera);
  const setIngestCamera = usePlayerStore((x) => x.setIngestCamera);
  const { width, height } = Dimensions.get("window");

  const [title, setTitle] = useState<string | undefined>();
  const [showCountdown, setShowCountdown] = useState(false);
  const [recordSubmitted, setRecordSubmitted] = useState(false);

  const navigation = useNavigation();
  const avatars = useAvatars(profile ? [profile?.did] : []);
  //const captureFrame = useCaptureVideoFrame();

  const isPlayerRatioGreater = pWidth / pHeight > width / height;
  const isSelfAndNotLive = ingest === "new";
  const isLive = ingest !== null && ingest !== "new";

  const ingestStarting = usePlayerStore((x) => x.ingestStarting);
  const setIngestStarting = usePlayerStore((x) => x.setIngestStarting);

  const { keyboardHeight } = useKeyboard();
  let { outerHeight, innerHeight } = useOuterAndInnerDimensions();
  let slideKeyboard = 0;
  if (Platform.OS === "ios" && keyboardHeight > 0) {
    slideKeyboard = -keyboardHeight + (outerHeight - innerHeight);
  }

  const { segmentDeltas, mean, range, connectionQuality } = useSegmentTiming();

  const dispatch = useAppDispatch();

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

  // reset ingest state on component unmount
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

  return (
    <>
      <View style={[layout.position.absolute, h.percent[100], w.percent[100]]}>
        <View
          style={[
            {
              padding: 6.5,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: 8,
            },
            layout.position.absolute,
            position.left[1],
            position.top[1],
          ]}
        >
          <View style={[layout.flex.row, layout.flex.center, gap.all[2]]}>
            <Pressable
              onPress={() => {
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("Home", { screen: "StreamList" });
              }}
            >
              <ChevronLeft />
            </Pressable>
            <Image
              source={
                profile?.did
                  ? { url: avatars[profile?.did]?.avatar }
                  : require("assets/images/goose.png")
              }
              width={32}
              height={32}
              style={[
                {
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: "green",
                },
                borders.width.thin,
                borders.color.gray[700],
              ]}
            />
            <Text>{profile?.handle}</Text>
          </View>
        </View>
        <View
          style={[
            {
              padding: 10,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 8,
            },
            layout.position.absolute,
            position.right[1],
            position.top[1],
            gap.all[4],
          ]}
        >
          {ingest === null ? (
            <ViewerContextMenu />
          ) : (
            <Pressable onPress={doSetIngestCamera}>
              <SwitchCamera size={32} color={colors.gray[200]} />
            </Pressable>
          )}
        </View>
      </View>
      {(isLive || isSelfAndNotLive) && (
        <View
          style={[
            layout.position.absolute,
            position.top[14],
            position.left[0],
            position.right[0],
            layout.flex.column,
            layout.flex.center,
          ]}
        >
          <MetricsPanel
            connectionQuality={connectionQuality}
            segmentDeltas={segmentDeltas}
            mean={mean || 999}
            range={range || 999}
          />
        </View>
      )}
      {isSelfAndNotLive ? (
        <InputPanel
          title={title}
          setTitle={setTitle}
          ingestStarting={ingestStarting}
          toggleGoLive={toggleGoLive}
          slideKeyboard={slideKeyboard}
        />
      ) : (
        <ChatPanel
          isPlayerRatioGreater={isPlayerRatioGreater}
          slideKeyboard={slideKeyboard}
        />
      )}
      <CountdownOverlay
        visible={showCountdown}
        width={width}
        height={height}
        startFrom={3}
        onDone={() => {
          setShowCountdown(false);
        }}
      />

      <Toast
        open={recordSubmitted}
        onOpenChange={setRecordSubmitted}
        title="You're live!"
        description="We're notifying your followers that you just went live."
        duration={5}
      />
    </>
  );
}
