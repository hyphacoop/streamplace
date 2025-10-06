import { Portal } from "@rn-primitives/portal";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  private timeoutIds: Map<string, ReturnType<typeof setTimeout>> = new Map();
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

    if (toast.duration > 0) {
      const timeoutId = setTimeout(() => {
        this.hide(toast.id);
      }, toast.duration * 1000);
      this.timeoutIds.set(toast.id, timeoutId);
    }
  }

  getToasts() {
    return this.toasts;
  }

  hide(id: string) {
    this.toasts = this.toasts.map((toast) =>
      toast.id === id ? { ...toast, open: false } : toast,
    );
    this.notifyListeners();

    const timeoutId = this.timeoutIds.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(id);
    }

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

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return (
    <>
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
    </>
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
  const [seconds, setSeconds] = useState(duration);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [height, setHeight] = useState(100);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width >= 768;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const scale = useSharedValue(1 - index * 0.05);

  useEffect(() => {
    return toastManager.subscribeHover(setIsHovered);
  }, []);

  useEffect(() => {
    if (isHovered) {
      // Stack vertically with proper spacing when hovered
      const spacing = height + 20; // Height of each toast + gap
      translateY.value = withTiming(-index * spacing, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
    } else {
      // Compact stacked view when not hovered
      translateY.value = withTiming(index * 10, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
      scale.value = withTiming(1 - index * 0.05, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(isLatest ? 1 : 0.8, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [isHovered, index, isLatest]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      zIndex: 1000 - index,
    };
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

  useEffect(() => {
    if (open && !isHovered) {
      // Start or resume the timer
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            runOnJS(onOpenChange)(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Pause timer when hovered or not open
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    if (!open) {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(100, { duration: 150 });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, isHovered]);

  useEffect(() => {
    if (open) {
      setSeconds(duration);

      opacity.value = withTiming(isLatest ? 1 : 0.8, {
        duration: 200,
        easing: Easing.out(Easing.exp),
      });
      translateY.value = withTiming(index * 10, {
        duration: 200,
        easing: Easing.out(Easing.exp),
      });
      scale.value = withTiming(1 - index * 0.05, {
        duration: 250,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [open, duration, index]);

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
    <Portal name={`toast-${index}`}>
      <Animated.View
        onLayout={(l) => setHeight(l.nativeEvent.layout.height)}
        style={[styles.container, containerPosition, animatedStyle]}
      >
        <Pressable
          onHoverIn={() => isWeb && toastManager.setHovered(true)}
          onHoverOut={() => isWeb && toastManager.setHovered(false)}
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
          <View style={{ gap: theme.spacing[1], width: "100%" }}>
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

          <View
            style={{
              gap: theme.spacing[1],
              flexDirection: "row",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            {onAction && (
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
            )}
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
        </Pressable>
      </Animated.View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
    paddingHorizontal: 16,
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
