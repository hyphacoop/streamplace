import { useNavigation } from "@react-navigation/native";
import { useLivestreamStore, usePlayerStore } from "@streamplace/components";
import { Input, Text, View } from "@streamplace/components/src/components/ui";
import { layout } from "@streamplace/components/src/lib/theme";
import {
  gap,
  h,
  position,
  w,
  zIndex,
} from "@streamplace/components/src/lib/theme/atoms";
import { ChevronLeft } from "@tamagui/lucide-icons";
import Chat from "components/chat/chat";
import ChatBox from "components/chat/chat-box";
import useAvatars from "hooks/useAvatars";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, Pressable } from "react-native";

export function MobileUi({ playerId }: { playerId: string }) {
  const ingest = usePlayerStore((x) => x.ingestConnectionState);
  const isLive = ingest === "connected";
  const profile = useLivestreamStore((x) => x.profile);
  const pHeight = Number(usePlayerStore((x) => x.playerHeight)) || 0;
  const pWidth = Number(usePlayerStore((x) => x.playerWidth)) || 0;
  const { width, height } = Dimensions.get("window");

  const [title, setTitle] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const navigation = useNavigation();
  const avatars = useAvatars([profile?.did!])[profile?.did!];

  const isPlayerRatioGreater = pWidth / pHeight > width / height;
  const isSelfAndNotLive = ingest === "new";

  const ingestStarting = usePlayerStore((x) => x.ingestStarting, playerId);
  const setIngestStarting = usePlayerStore(
    (x) => x.setIngestStarting,
    playerId,
  );

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const inputOpacity = useRef(new Animated.Value(1)).current;
  const chatOpacity = useRef(new Animated.Value(0)).current;

  // Countdown effect with fade out on expand
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdown && countdown > 0) {
      // Fade out input area
      Animated.timing(inputOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Reset animation values
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => {
        timer = setTimeout(() => {
          setCountdown((c) => c - 1);
        }, 100);
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
    return () => clearTimeout(timer);
  }, [
    showCountdown,
    countdown,
    setIngestStarting,
    scaleAnim,
    opacityAnim,
    inputOpacity,
    chatOpacity,
  ]);

  const toggleGoLive = () => {
    if (!ingestStarting) {
      if (title.trim() === "") {
        console.warn("Title cannot be empty when starting a stream.");
        return;
      }
      setShowCountdown(true);
      setIngestStarting(true);
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
              borderRadius: 16,
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
            { opacity: inputOpacity },
          ]}
        >
          <Input value={title} onChange={(e) => setTitle(e)} />
          {ingestStarting ? (
            <Text>Starting your stream...</Text>
          ) : (
            <Pressable onPress={toggleGoLive}>
              <Text>Go Live Button</Text>
            </Pressable>
          )}
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
