import {
  Text,
  useDanmuUnlocked,
  useSetDanmuUnlocked,
  useToast,
  useTranslation,
} from "@streamplace/components";
import { useState } from "react";
import { Pressable, View } from "react-native";
import pkg from "../../package.json";

const UNLOCK_TAP_COUNT = 5;

// maybe someday some PWA update stuff will live here
export function Updates() {
  const { t } = useTranslation("settings");
  const [tapCount, setTapCount] = useState(0);
  const danmuUnlocked = useDanmuUnlocked();
  const setDanmuUnlocked = useSetDanmuUnlocked();
  const toast = useToast();

  const handlePress = () => {
    if (danmuUnlocked) {
      toast.show("You are already a developer", "what are you doing???");
      return;
    }

    const newCount = tapCount + 1;
    console.log("new tap count");
    setTapCount(newCount);

    if (newCount >= UNLOCK_TAP_COUNT) {
      setDanmuUnlocked(true);
      toast.show("You are now a developer", "have fun! lol", {
        duration: 20,
        variant: "success",
      });
      setTapCount(0);
    }
  };

  return (
    <View
      style={[
        { alignItems: "center" },
        { justifyContent: "center" },
        { paddingVertical: 24 },
      ]}
    >
      <Pressable onPress={handlePress}>
        <Text
          size="2xl"
          style={[
            {
              fontWeight: "bold",
              textAlign: "center",
              color: "#fff",
            },
          ]}
        >
          {t("app-version", { version: pkg.version })}
        </Text>
      </Pressable>
    </View>
  );
}
