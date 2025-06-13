import { useNavigation } from "@react-navigation/native";
import { useLivestreamStore, usePlayerStore } from "@streamplace/components";
import { Input, Text, View } from "@streamplace/components/src/components/ui";
import { layout } from "@streamplace/components/src/lib/theme";
import {
  gap,
  h,
  mt,
  p,
  position,
  px,
  py,
  sizes,
  w,
  zIndex,
} from "@streamplace/components/src/lib/theme/atoms";
import { ChevronLeft } from "@tamagui/lucide-icons";
import Chat from "components/chat/chat";
import ChatBox from "components/chat/chat-box";
import { createLivestreamRecord } from "features/bluesky/blueskySlice";
import useAvatars from "hooks/useAvatars";
import { useKeyboard } from "hooks/useKeyboard";
import { useOuterAndInnerDimensions } from "hooks/useOuterAndInnerDimensions";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Pressable,
} from "react-native";
import { useAppDispatch } from "store/hooks";

export function MobileUi({ playerId }: { playerId: string }) {
  const ingest = usePlayerStore((x) => x.ingestConnectionState);
  const profile = useLivestreamStore((x) => x.profile);
  const pHeight = Number(usePlayerStore((x) => x.playerHeight)) || 0;
  const pWidth = Number(usePlayerStore((x) => x.playerWidth)) || 0;
  const { width, height } = Dimensions.get("window");

  const [title, setTitle] = useState<string | undefined>();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recordSubmitted, setRecordSubmitted] = useState(false);

  const navigation = useNavigation();
  const avatars = useAvatars([profile?.did!])[profile?.did!];
  //const captureFrame = useCaptureVideoFrame();

  const isPlayerRatioGreater = pWidth / pHeight > width / height;
  const isSelfAndNotLive = ingest === "new";

  const ingestStarting = usePlayerStore((x) => x.ingestStarting, playerId);
  const setIngestStarting = usePlayerStore(
    (x) => x.setIngestStarting,
    playerId,
  );

  const { keyboardHeight } = useKeyboard();
  let { outerHeight, innerHeight } = useOuterAndInnerDimensions();
  let slideKeyboard = 0;
  if (Platform.OS === "ios" && keyboardHeight > 0) {
    slideKeyboard = -keyboardHeight + (outerHeight - innerHeight);
  }

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const chatOpacity = useRef(new Animated.Value(0)).current;

  const dispatch = useAppDispatch();

  // Countdown effect with fade out on expand
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      // Fade out input area
      Animated.timing(inputOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Reset animation values
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCountdown((c) => c - 1);
      });
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setCountdown(3);
      // Fade in chat
      Animated.timing(chatOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [
    showCountdown,
    countdown,
    setIngestStarting,
    scaleAnim,
    opacityAnim,
    inputOpacity,
    chatOpacity,
  ]);

  const handleSubmit = async () => {
    try {
      if (!title) {
        return console.warn("Title cannot be empty");
      }
      //const thumbnailToUse = await captureFrame(1280, 0.85);
      dispatch(
        createLivestreamRecord({
          title,
          customThumbnail: undefined, // thumbnailToUse || undefined,
        }),
      );
    } catch (error) {
      console.error("Error creating livestream:", error);
    } finally {
      setRecordSubmitted(false);
    }
  };

  const toggleGoLive = () => {
    if (!ingestStarting) {
      if (!title) {
        console.warn("Title cannot be empty when starting a stream.");
        return;
      }
      // if keyboard is open, close it
      if (Platform.OS === "ios" && keyboardHeight > 0) {
        Keyboard.dismiss();
      }
      setShowCountdown(true);
      setIngestStarting(true);
      handleSubmit();
      setCountdown(3);
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

  return (
    <>
      <View
        style={[
          {
            padding: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: 8,
          },
          layout.position.absolute,
          zIndex[40],
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
            source={avatars?.avatar || require("assets/images/goose.png")}
            width={32}
            height={32}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: "green",
            }}
          />
          <Text>{profile?.handle}</Text>
        </View>
      </View>
      {isSelfAndNotLive ? (
        <Animated.View
          style={[
            layout.position.absolute,
            h.percent[30],
            position.bottom[0],
            zIndex[10],
            w.percent[100],
            layout.flex.center,
            { opacity: inputOpacity },
            { transform: [{ translateY: slideKeyboard }] },
          ]}
        >
          <View
            style={[
              layout.flex.column,
              gap.all[2],
              { padding: 10 },
              sizes.maxWidth[80],
            ]}
          >
            <View backgroundColor="rgba(64,64,64,0.8)" borderRadius={12}>
              <Input
                value={title}
                onChange={(e) => setTitle(e)}
                placeholder="Enter stream title"
                onEndEditing={Keyboard.dismiss}
              />
            </View>
            {ingestStarting ? (
              <Text>Starting your stream...</Text>
            ) : (
              <View style={[layout.flex.center]}>
                <Pressable
                  onPress={toggleGoLive}
                  style={[
                    px[4],
                    py[2],
                    layout.flex.row,
                    layout.flex.center,
                    gap.all[1],
                    {
                      backgroundColor: "rgba(64,64,64, 0.8)",
                      borderRadius: 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      p[2],
                      {
                        backgroundColor: "rgba(256,0,0, 0.8)",
                        borderRadius: 12,
                      },
                    ]}
                  />
                  <Text center>Go Live</Text>
                </Pressable>
                <Text color="muted" size="xs" style={[mt[2]]}>
                  We'll announce that you're live on Bluesky.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            isPlayerRatioGreater
              ? layout.position.relative
              : layout.position.absolute,
            h.percent[30],
            position.bottom[0],
            zIndex[10],
            w.percent[100],
            { opacity: chatOpacity },
          ]}
        >
          <Chat isChatVisible={true} setIsChatVisible={() => true} />
          <ChatBox />
        </Animated.View>
      )}
      {showCountdown && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            backgroundColor: "rgba(0,0,0,0.7)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Animated.Text
            style={{
              color: "white",
              fontSize: 120,
              fontWeight: "bold",
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }}
          >
            {countdown}
          </Animated.Text>
        </View>
      )}
    </>
  );
}
