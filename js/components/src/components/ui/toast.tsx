import { Portal } from "@rn-primitives/portal";
import { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../ui";

type ToastConfig = {
  title: string;
  description?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastState = {
  id: string;
  open: boolean;
  title: string;
  description?: string;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
};

class ToastManager {
  private listeners: Set<(state: ToastState | null) => void> = new Set();
  private currentToast: ToastState | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(config: ToastConfig) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    const toast: ToastState = {
      id: Math.random().toString(36).substr(2, 9),
      open: true,
      title: config.title,
      description: config.description,
      duration: config.duration ?? 3,
      actionLabel: config.actionLabel,
      onAction: config.onAction,
    };

    this.currentToast = toast;
    this.notifyListeners();

    if (toast.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, toast.duration * 1000);
    }
  }

  hide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.currentToast = null;
    this.notifyListeners();
  }

  subscribe(listener: (state: ToastState | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentToast));
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
    },
  ) => {
    toastManager.show({
      title,
      description,
      ...options,
    });
  },
  hide: () => toastManager.hide(),
};

export function useToast() {
  const [toastState, setToastState] = useState<ToastState | null>(null);

  useEffect(() => {
    return toastManager.subscribe(setToastState);
  }, []);

  return {
    toast: toastState,
    ...toast,
  };
}

export function ToastProvider() {
  const [toastState, setToastState] = useState<ToastState | null>(null);

  useEffect(() => {
    return toastManager.subscribe(setToastState);
  }, []);

  if (!toastState?.open) return null;

  return (
    <Toast
      open={toastState.open}
      onOpenChange={(open) => {
        if (!open) toastManager.hide();
      }}
      title={toastState.title}
      description={toastState.description}
      actionLabel={toastState.actionLabel}
      onAction={toastState.onAction}
      duration={toastState.duration}
    />
  );
}

type ToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // seconds
};

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Action",
  onAction,
  duration = 3,
}: ToastProps) {
  const [seconds, setSeconds] = useState(duration);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= 768;

  const containerPosition: ViewStyle = isDesktop
    ? {
        top: undefined,
        bottom: theme.spacing[4],
        right: theme.spacing[4], // <-- use spacing, not 1
        alignItems: "flex-end",
        minWidth: 400,
        width: 400,
        // Do NOT set left at all
      }
    : {
        bottom: insets.bottom + theme.spacing[1],
        left: 0,
        right: 0,
        alignItems: "center",
        width: "100%",
        maxWidth: undefined,
      };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (open) {
      setSeconds(duration);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            onOpenChange(false);
            if (interval) clearInterval(interval);
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      setSeconds(duration);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line
  }, [open, duration]);

  if (!open) return null;

  return (
    <Portal name="toast">
      <Animated.View
        style={[styles.container, containerPosition, { opacity: fadeAnim }]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.toast,
            {
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.xl,
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              padding: theme.spacing[4],
              width: isDesktop ? "100%" : "95%",
            },
          ]}
        >
          <View style={{ gap: theme.spacing[1], width: "100%" }}>
            <Text
              style={[
                {
                  color: theme.colors.foreground,
                  fontSize: 16,
                  fontWeight: "500",
                },
              ]}
            >
              {title}
            </Text>
            {description ? (
              <Text style={[{ color: theme.colors.foreground, fontSize: 14 }]}>
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
        </View>
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
