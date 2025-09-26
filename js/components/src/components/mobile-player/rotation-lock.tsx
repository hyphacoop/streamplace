import * as ScreenOrientation from "expo-screen-orientation";
import { Orientation, OrientationLock } from "expo-screen-orientation";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface RotationContextValue {
  currentOrientation: Orientation;
  isLocked: boolean;
  isActive: boolean;
  rotateToLandscape: () => Promise<void>;
  rotateToPortrait: () => Promise<void>;
  toggleRotation: () => Promise<void>;
  canRotate: boolean;
}

export interface RotationProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

const RotationContext = createContext<RotationContextValue | null>(null);

export const RotationProvider: React.FC<RotationProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [canRotate, setCanRotate] = useState(true);
  const currentOrientation = useRef<Orientation>(Orientation.PORTRAIT_UP);

  // Manual rotation functions
  const rotateToLandscape = async () => {
    if (!enabled || !canRotate) return;

    try {
      await ScreenOrientation.unlockAsync();
      await ScreenOrientation.lockAsync(OrientationLock.LANDSCAPE_RIGHT);
      setIsLocked(true);

      // set current orientation to landscape left for consistency
      currentOrientation.current = Orientation.LANDSCAPE_RIGHT;

      if (__DEV__) {
        console.log("📲 Manual landscape");
      }
    } catch (error) {
      console.warn("Failed to rotate to landscape:", error);
    }
  };

  const rotateToPortrait = async () => {
    if (!enabled || !canRotate) return;

    try {
      await ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP);
      setIsLocked(true);

      currentOrientation.current = Orientation.PORTRAIT_UP;

      if (__DEV__) {
        console.log("📲 Manual portrait");
      }
    } catch (error) {
      console.warn("Failed to rotate to portrait:", error);
    }
  };

  const toggleRotation = async () => {
    const isLandscape =
      currentOrientation.current === Orientation.LANDSCAPE_LEFT ||
      currentOrientation.current === Orientation.LANDSCAPE_RIGHT;

    if (__DEV__) {
      console.log(
        `🔄 Toggle: current=${currentOrientation.current}, isLandscape=${isLandscape}`,
      );
    }

    if (isLandscape) {
      await rotateToPortrait();
    } else {
      await rotateToLandscape();
    }
  };

  // Track orientation changes
  useEffect(() => {
    if (!enabled) return;

    const getCurrentOrientation = async () => {
      try {
        const orient = await ScreenOrientation.getOrientationAsync();
        currentOrientation.current = orient;

        if (__DEV__) {
          console.log(`📲 Orientation on load: ${orient}`);
        }
      } catch (error) {
        console.warn("Failed to get orientation:", error);
      }
    };

    getCurrentOrientation();

    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        const newOrientation = event.orientationInfo.orientation;
        currentOrientation.current = newOrientation;

        if (__DEV__) {
          console.log(
            `🔄 Orientation: ${newOrientation} (locked: ${isLocked})`,
          );
        }

        // Only allow natural rotation when unlocked
        if (!isLocked) {
          // Natural rotation is happening, let it continue
        }
      },
    );

    return () => {
      subscription?.remove();
      ScreenOrientation.removeOrientationChangeListeners();
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, [enabled]);

  const contextValue = useMemo(
    () => ({
      currentOrientation: currentOrientation.current,
      isLocked,
      isActive: enabled,
      rotateToLandscape,
      rotateToPortrait,
      toggleRotation,
      canRotate,
    }),
    [isLocked, enabled, canRotate],
  );

  return (
    <RotationContext.Provider value={contextValue}>
      {children}
    </RotationContext.Provider>
  );
};

export const useRotation = (): RotationContextValue => {
  const context = useContext(RotationContext);
  if (!context) {
    throw new Error("useRotation must be used within a RotationProvider");
  }
  return context;
};
