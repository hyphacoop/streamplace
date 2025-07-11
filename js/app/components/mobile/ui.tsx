import { useNavigation } from "@react-navigation/native";
import {
  atoms,
  PlayerUI,
  Resizable,
  Text,
  Toast,
  useAvatars,
  useCameraToggle,
  useLivestreamInfo,
  usePlayerDimensions,
  useSegmentDimensions,
  View,
} from "@streamplace/components";
import { bottom } from "@streamplace/components/src/lib/theme/atoms";
import { ChevronLeft, SwitchCamera } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable } from "react-native";
import { ChatPanel } from "./chat";

const { borders, colors, gap, h, layout, position, w } = atoms;

export function MobileUi() {
  const navigation = useNavigation();
  const {
    ingest,
    profile,
    title,
    setTitle,
    showCountdown,
    setShowCountdown,
    recordSubmitted,
    setRecordSubmitted,
    ingestStarting,
    setIngestStarting,
    toggleGoLive,
  } = useLivestreamInfo();
  const { width, height } = usePlayerDimensions();
  const {
    isPlayerRatioGreater,
    width: pwidth,
    height: pheight,
  } = useSegmentDimensions();
  const { doSetIngestCamera } = useCameraToggle();
  const avatars = useAvatars(profile?.did ? [profile?.did] : []);

  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (ingestStarting) {
        setIngestStarting(false);
      }
    };
  }, [ingestStarting, setIngestStarting]);

  useEffect(() => {
    if (recordSubmitted) setShowLoading(false);
  }, [recordSubmitted]);

  const isSelfAndNotLive = ingest === "new";
  const isLive = ingest !== null && ingest !== "new";

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
              <ChevronLeft color="white" />
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
            <Text>@{profile?.handle}</Text>
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
            position.right[12],
            position.top[2],
            gap.all[4],
          ]}
        >
          <PlayerUI.Viewers />
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
            <PlayerUI.ContextMenu />
          ) : (
            <Pressable onPress={doSetIngestCamera}>
              <SwitchCamera size={32} color={colors.gray[200]} />
            </Pressable>
          )}
        </View>
      </View>
      {isLive && (
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
          <PlayerUI.MetricsPanel showMetrics={isLive || isSelfAndNotLive} />
        </View>
      )}
      {isSelfAndNotLive ? (
        <PlayerUI.InputPanel
          title={title}
          setTitle={setTitle}
          ingestStarting={ingestStarting}
          toggleGoLive={toggleGoLive}
        />
      ) : (
        <View
          style={[
            isPlayerRatioGreater
              ? layout.position.relative
              : layout.position.absolute,
            bottom[0],
            { width: "100%", maxWidth: "100%" },
          ]}
        >
          <Resizable
            isPlayerRatioGreater={isPlayerRatioGreater}
            startingPercentage={0.4}
          >
            <ChatPanel />
          </Resizable>
        </View>
      )}

      <PlayerUI.CountdownOverlay
        visible={showCountdown}
        width={width}
        height={height - 150}
        onDone={() => {
          if (!recordSubmitted && title != "") {
            setShowLoading(true);
          }
          setShowCountdown(false);
        }}
      />

      <PlayerUI.LoadingOverlay
        visible={showLoading}
        width={width}
        height={height - 150}
        subtitle="We're setting up your stream."
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
