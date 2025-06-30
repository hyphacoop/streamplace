import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboard } from "../hooks/useKeyboard";
import { useOuterAndInnerDimensions } from "../hooks/useOuterAndInnerDimensions";

export function useKeyboardSlide() {
  const { keyboardHeight } = useKeyboard();
  const { outerHeight, innerHeight } = useOuterAndInnerDimensions();
  const { bottom: safeBottom } = useSafeAreaInsets();
  let slideKeyboard = 0;
  if (Platform.OS === "ios" && keyboardHeight > 0) {
    slideKeyboard = -keyboardHeight + (outerHeight - innerHeight);
  } else if (Platform.OS === "ios" && keyboardHeight === 0) {
    slideKeyboard = -safeBottom;
  }
  return { keyboardHeight, slideKeyboard };
}
