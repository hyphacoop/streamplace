import { memo, useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ChatMessageViewHydrated } from "streamplace";
import { Text } from "../ui";

interface DanmuMessageProps {
  message: ChatMessageViewHydrated;
  lane: number;
  laneHeight: number;
  videoTop: number;
  opacity: number;
  fontSize: number;
  speed: number;
  containerWidth: number;
  containerHeight: number;
  onComplete: (messageId: string) => void;
  onWidthMeasured?: (messageId: string, width: number) => void;
}

const BASE_DURATION = 8000;
const MIN_DURATION = 6000;
const MAX_DURATION = 12000;

export const DanmuMessage = memo(
  ({
    message,
    lane,
    laneHeight,
    videoTop,
    opacity,
    fontSize,
    speed,
    containerWidth,
    containerHeight,
    onComplete,
    onWidthMeasured,
  }: DanmuMessageProps) => {
    const translateX = useSharedValue(containerWidth);
    const [messageWidth, setMessageWidth] = useState(0);

    const mapRange = (
      num: number,
      inMin: number,
      inMax: number,
      outMin: number,
      outMax: number,
    ) => {
      return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    };

    const getRgbColor = (
      color: {
        red: number;
        green: number;
        blue: number;
      } = { red: 123, green: 123, blue: 123 },
    ) => {
      const red = mapRange(color.red, 0, 255, 160, 230);
      const green = mapRange(color.green, 0, 255, 160, 230);
      const blue = mapRange(color.blue, 0, 255, 160, 230);

      return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
    };

    const handleLayout = (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width > 0) {
        setMessageWidth(width);
        if (onWidthMeasured) {
          onWidthMeasured(message.uri, width);
        }
      }
    };

    useEffect(() => {
      if (messageWidth === 0) return; // Wait for layout measurement

      const baseDuration = (BASE_DURATION * message.record.text.length) / 10;
      const duration = Math.max(
        MIN_DURATION / speed,
        Math.min(baseDuration / speed, MAX_DURATION / speed),
      );

      console.log(
        `[danmu] animation started: "${message.record.text}" (duration: ${duration.toFixed(0)}ms, speed: ${speed}x)`,
      );

      // Start from right edge + message width so entire message is off-screen
      translateX.value = containerWidth;

      translateX.value = withTiming(
        -messageWidth,
        {
          duration,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            runOnJS(onComplete)(message.uri);
          }
        },
      );
    }, [
      messageWidth,
      containerWidth,
      speed,
      message.uri,
      message.record.text.length,
      lane,
      onComplete,
    ]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: translateX.value }],
      };
    });

    return (
      <Animated.View
        style={[
          styles.container,
          {
            top: videoTop + lane * laneHeight,
            opacity: opacity / 100,
          },
          animatedStyle,
        ]}
        onLayout={handleLayout}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize,
              color: getRgbColor(message.chatProfile?.color),
            },
          ]}
          numberOfLines={1}
        >
          {message.record.text}
        </Text>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.uri === nextProps.message.uri &&
      prevProps.lane === nextProps.lane &&
      prevProps.laneHeight === nextProps.laneHeight &&
      prevProps.videoTop === nextProps.videoTop &&
      prevProps.opacity === nextProps.opacity &&
      prevProps.fontSize === nextProps.fontSize &&
      prevProps.speed === nextProps.speed &&
      prevProps.containerWidth === nextProps.containerWidth &&
      prevProps.containerHeight === nextProps.containerHeight
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
  },
  text: {
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
    fontWeight: "600",
  },
});
