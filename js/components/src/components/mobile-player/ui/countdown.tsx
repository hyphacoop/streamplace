import { useEffect, useRef, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type CountdownOverlayProps = {
  visible: boolean;
  width: number;
  height: number;
  startFrom?: number;
  onDone?: () => void;
};

export function CountdownOverlay({
  visible,
  width,
  height,
  startFrom = 3,
  onDone,
}: CountdownOverlayProps) {
  const [countdown, setCountdown] = useState(startFrom);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animate and handle countdown
  useEffect(() => {
    if (visible) {
      setCountdown(startFrom);
      console.log("Countdown started from:", startFrom);

      // Start countdown interval
      intervalRef.current = setInterval(() => {
        console.log("Setting countdown");
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            console.log("Probably done");
            if (onDone) onDone();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(startFrom);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, startFrom]);

  // Animate scale and opacity on countdown change
  useEffect(() => {
    if (visible && countdown > 0) {
      scale.value = 1;
      opacity.value = 1;
      scale.value = withTiming(1.5, { duration: 1000 });
      opacity.value = withTiming(0, { duration: 1000 });
    }
  }, [countdown, visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || countdown === 0) return null;

  return (
    <Animated.View
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
        style={[
          {
            color: "white",
            fontSize: 120,
            fontWeight: "bold",
          },
          animatedStyle,
        ]}
      >
        {typeof countdown === "number" ? countdown : ""}
      </Animated.Text>
    </Animated.View>
  );
}
