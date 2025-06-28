import { useKeyboardSlide } from "@streamplace/components/src/hooks";
import { ChevronUp } from "lucide-react-native";
import { ComponentProps } from "react";
import { Dimensions } from "react-native";
import {
  Gesture,
  GestureDetector,
  Pressable,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { bottom, layout, p, w, zIndex } from "../../lib/theme/atoms";
import { View } from "./view";

const AnimatedView = Animated.createAnimatedComponent(View);

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type ResizableChatSheetProps = {
  isPlayerRatioGreater: boolean;
  style?: ComponentProps<typeof AnimatedView>["style"];
  children?: React.ReactNode;
};

const SPRING_CONFIG = { damping: 20, stiffness: 100 };

export function Resizable({
  isPlayerRatioGreater,
  style = {},
  children,
}: ResizableChatSheetProps) {
  const { slideKeyboard } = useKeyboardSlide();
  const MAX_HEIGHT = SCREEN_HEIGHT * 0.5;
  const MIN_HEIGHT = SCREEN_HEIGHT * 0.0;
  const COLLAPSE_HEIGHT = SCREEN_HEIGHT * 0.2;

  const sheetHeight = useSharedValue(MIN_HEIGHT);
  const startHeight = useSharedValue(MIN_HEIGHT);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      let newHeight = startHeight.value - event.translationY;
      if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;
      if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
      sheetHeight.value = newHeight;

      if (newHeight < COLLAPSE_HEIGHT) {
        sheetHeight.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
    opacity: sheetHeight.value > 0 ? 1 : 0,
    transform: [{ translateY: slideKeyboard }],
  }));

  const handleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sheetHeight.value < COLLAPSE_HEIGHT ? 1 : 0,
    transform: [
      {
        translateY: sheetHeight.value < COLLAPSE_HEIGHT ? 0 : withSpring(20),
      },
    ],
  }));

  return (
    <>
      <Animated.View
        style={[
          handleAnimatedStyle,
          layout.position.absolute,
          bottom[4],
          w.percent[100],
          layout.flex.center,
          zIndex[1],
        ]}
      >
        <Pressable
          onPress={() => {
            sheetHeight.value =
              sheetHeight.value === MIN_HEIGHT
                ? withSpring(MAX_HEIGHT, SPRING_CONFIG)
                : withSpring(MIN_HEIGHT, SPRING_CONFIG);
          }}
        >
          <View
            style={[
              p[1],
              {
                borderRadius: 999,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                overflow: "hidden",
              },
            ]}
          >
            <ChevronUp
              size={32}
              color="white"
              style={{ marginBottom: 1, marginTop: -1 }}
            />
          </View>
        </Pressable>
      </Animated.View>
      <AnimatedView
        style={[
          animatedStyle,
          isPlayerRatioGreater
            ? layout.position.relative
            : layout.position.absolute,
          bottom[0],
          zIndex[1],
          w.percent[100],
          {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            overflow: "visible",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
          style,
        ]}
      >
        <View style={[layout.flex.row, layout.flex.justifyCenter]}>
          <GestureDetector gesture={panGesture}>
            <View
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={[
                w[32],
                {
                  height: 6,
                  transform: [{ translateY: -10 }],
                  backgroundColor: "#eeeeee66",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                },
              ]}
            />
          </GestureDetector>
        </View>
        {children}
      </AnimatedView>
    </>
  );
}

Resizable.displayName = "ResizableChatSheet";
