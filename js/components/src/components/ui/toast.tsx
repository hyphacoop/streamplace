import { Portal } from "@rn-primitives/portal";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Circle, Svg } from "react-native-svg";
import { useTheme } from "../../ui";
import { Text } from "./text";

type ToastConfig = {
  title: string;
  description?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "success" | "error" | "info";
};

type ToastState = {
  id: string;
  open: boolean;
  title: string;
  description?: string;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "success" | "error" | "info";
};

class ToastManager {
  private listeners: Set<(state: ToastState[]) => void> = new Set();
  private toasts: ToastState[] = [];

  private hoverListeners: Set<(isHovered: boolean) => void> = new Set();
  private isHovered: boolean = false;

  show(config: ToastConfig) {
    const toast: ToastState = {
      id: Math.random().toString(36).slice(2, 12),
      open: true,
      title: config.title,
      description: config.description,
      duration: config.duration ?? 3,
      actionLabel: config.actionLabel,
      onAction: config.onAction,
      variant: config.variant ?? "default",
    };

    this.toasts = [...this.toasts, toast];
    this.notifyListeners();
  }

  getToasts() {
    return this.toasts;
  }

  hide(id: string) {
    this.toasts = this.toasts.map((toast) =>
      toast.id === id ? { ...toast, open: false } : toast,
    );
    this.notifyListeners();

    setTimeout(() => {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
      this.notifyListeners();
    }, 500);
  }

  subscribe(listener: (state: ToastState[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeHover(listener: (isHovered: boolean) => void) {
    this.hoverListeners.add(listener);
    return () => {
      this.hoverListeners.delete(listener);
    };
  }

  setHovered(hovered: boolean) {
    this.isHovered = hovered;
    this.notifyHoverListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.toasts));
  }

  private notifyHoverListeners() {
    this.hoverListeners.forEach((listener) => listener(this.isHovered));
  }
}

const toastManager = new ToastManager();

export const toast = {
  show: (
    title: string,
    description?: string,
    options?: {
      duration?: number;
      actionLabel?: string;
      onAction?: () => void;
      variant?: "default" | "success" | "error" | "info";
    },
  ) => {
    toastManager.show({
      title,
      description,
      ...options,
    });
  },
  hide: (id?: string) => {
    if (id) {
      toastManager.hide(id);
    } else {
      const toasts = toastManager.getToasts();
      if (toasts.length > 0) {
        toastManager.hide(toasts[toasts.length - 1].id);
      }
    }
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return {
    toasts,
    ...toast,
  };
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width >= 768;

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  const gesture =
    Platform.OS === "web"
      ? Gesture.Hover()
          .onStart(() => {
            runOnJS(toastManager.setHovered)(true);
          })
          .onEnd(() => {
            runOnJS(toastManager.setHovered)(false);
          })
      : Gesture.LongPress()
          .onStart(() => {
            runOnJS(toastManager.setHovered)(true);
          })
          .onEnd(() => {
            runOnJS(toastManager.setHovered)(false);
          });

  const containerPosition: ViewStyle = isDesktop
    ? {
        bottom: theme.spacing[4],
        right: theme.spacing[4],
        alignItems: "flex-end",
        minWidth: 400,
        width: 400,
      }
    : {
        bottom: insets.bottom + theme.spacing[1],
        left: 0,
        right: 0,
        alignItems: "center",
        width: "100%",
      };

  return (
    <Portal name="toasties">
      <GestureDetector gesture={gesture}>
        <View style={[styles.providerContainer, containerPosition]}>
          {toasts
            .slice(-4)
            .reverse()
            .map((toastState, index) => (
              <Toast
                key={toastState.id}
                open={toastState.open}
                onOpenChange={(open) => {
                  if (!open) toastManager.hide(toastState.id);
                }}
                title={toastState.title}
                description={toastState.description}
                actionLabel={toastState.actionLabel}
                onAction={toastState.onAction}
                duration={toastState.duration}
                index={index}
                isLatest={index === 0}
                totalToasts={toasts.length}
                variant={toastState.variant}
              />
            ))}
        </View>
      </GestureDetector>
    </Portal>
  );
}

type ToastProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  index?: number;
  isLatest?: boolean;
  totalToasts?: number;
  variant?: "default" | "success" | "error" | "info";
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function Toast({
  open = false,
  onOpenChange = () => {},
  title = "",
  description,
  actionLabel = "Action",
  onAction,
  duration = 60,
  index = 0,
  isLatest = true,
  totalToasts = 0,
  variant = "default",
}: ToastProps) {
  const [isHovered, setIsHovered] = useState(false);
  const progress = useSharedValue(1);
  const remainingTime = useSharedValue(duration * 1000);
  const wasOpen = useRef(open);
  const [height, setHeight] = useState(100);
  const { theme } = useTheme();
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width >= 768;

  const RADIUS = 8;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    };
  });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const scale = useSharedValue(1 - index * 0.05);

  useEffect(() => {
    return toastManager.subscribeHover(setIsHovered);
  }, []);

  useEffect(() => {
    if (open && !wasOpen.current) {
      // Toast just opened
      progress.value = 1;
      remainingTime.value = duration * 1000;
    }
    wasOpen.current = open;

    if (!open) {
      // Close animation
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(100, { duration: 250 });
      return;
    }

    if (isHovered) {
      // Stack vertically with proper spacing when hovered
      const spacing = height + 20; // Height of each toast + gap
      translateY.value = withTiming(-index * spacing, {
        duration: 750,
        easing: Easing.out(Easing.exp),
      });
      scale.value = withTiming(1, {
        duration: 750,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(1, {
        duration: 750,
        easing: Easing.out(Easing.exp),
      });
    } else {
      // Compact stacked view when not hovered
      translateY.value = withTiming(-index * 15, {
        duration: 750,
        easing: Easing.out(Easing.exp),
      });
      scale.value = withTiming(1 - index * 0.1, {
        duration: 750,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(isLatest ? 1 : 0.8, {
        duration: 750,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [open, isHovered, index, isLatest, height, duration]);

  useEffect(() => {
    if (open && isLatest && duration > 0) {
      if (isHovered) {
        cancelAnimation(progress);
        remainingTime.value = progress.value * duration * 1000;
      } else {
        progress.value = withTiming(
          0,
          {
            duration: remainingTime.value,
            easing: Easing.linear,
          },
          (finished) => {
            if (finished) {
              runOnJS(onOpenChange)(false);
            }
          },
        );
      }
    } else {
      cancelAnimation(progress);
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [open, isLatest, isHovered, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      zIndex: 1000 - index,
    };
  });

  const variantStyles = {
    default: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.border,
    },
    success: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    error: {
      backgroundColor: theme.colors.destructive,
      borderColor: theme.colors.destructive,
    },
    info: {
      backgroundColor: theme.colors.info,
      borderColor: theme.colors.info,
    },
  };

  return (
    <Animated.View
      onLayout={(l) => setHeight(l.nativeEvent.layout.height)}
      style={[styles.container, animatedStyle]}
    >
      <View
        style={[
          styles.toast,
          {
            borderRadius: theme.borderRadius.xl,
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: theme.spacing[4],
            width: isDesktop ? "100%" : "95%",
          },
          variantStyles[variant],
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            width: "100%",
            gap: theme.spacing[4],
          }}
        >
          <View style={{ flex: 1, gap: theme.spacing[1] }}>
            <Text
              style={{
                color: theme.colors.foreground,
                fontSize: 16,
                fontWeight: "500",
              }}
            >
              {title}
            </Text>
            {description ? (
              <Text style={{ color: theme.colors.foreground, fontSize: 14 }}>
                {description}
              </Text>
            ) : null}
          </View>
          {isLatest && duration > 0 ? (
            <Pressable
              onPress={() => onOpenChange(false)}
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <AnimatedCircle
                  stroke={theme.colors.border}
                  fill="transparent"
                  strokeWidth="2"
                  r={RADIUS}
                  cx="12"
                  cy="12"
                />
                <AnimatedCircle
                  animatedProps={animatedCircleProps}
                  stroke={theme.colors.primary}
                  fill="transparent"
                  strokeWidth="2"
                  strokeDasharray={CIRCUMFERENCE}
                  r={RADIUS}
                  cx="12"
                  cy="12"
                  rotation="-90"
                  originX="12"
                  originY="12"
                  strokeLinecap="round"
                />
              </Svg>
              {!onAction && (
                <View style={{ position: "absolute" }}>
                  <X color={theme.colors.foreground} size={12} />
                </View>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => onOpenChange(false)}
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <AnimatedCircle
                  stroke={theme.colors.border}
                  fill={theme.colors.muted}
                  strokeWidth="2"
                  r={RADIUS}
                  cx="12"
                  cy="12"
                />
              </Svg>
              {!onAction && (
                <View style={{ position: "absolute" }}>
                  <X color={theme.colors.foreground} size={12} />
                </View>
              )}
            </Pressable>
          )}
        </View>
        {onAction && (
          <View
            style={{
              gap: theme.spacing[1],
              flexDirection: "row",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Pressable
              style={[
                styles.button,
                {
                  borderColor: theme.colors.primary,
                  paddingHorizontal: theme.spacing[4],
                  paddingVertical: theme.spacing[2],
                },
              ]}
              onPress={onAction}
            >
              <Text style={{ color: theme.colors.foreground }}>
                {actionLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                {
                  borderColor: theme.colors.primary,
                  paddingHorizontal: theme.spacing[4],
                  paddingVertical: theme.spacing[2],
                },
              ]}
              onPress={() => onOpenChange(false)}
            >
              <Text style={{ color: theme.colors.foreground }}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  providerContainer: {
    position: "absolute",
    zIndex: 1000,
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toast: {
    opacity: 0.95,
    borderWidth: 1,
    gap: 8,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
