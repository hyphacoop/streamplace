import {
  Text,
  useDanmuUnlocked,
  useSetDanmuUnlocked,
  useToast,
} from "@streamplace/components";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import pkg from "../../package.json";
import { SettingsRowItem } from "./components/settings-navigation-item";

const UNLOCK_TAP_COUNT = 5;

// maybe someday some PWA update stuff will live here
export function Updates() {
  const { t } = useTranslation("settings");
  const toast = useToast();
  const [checked, setChecked] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const danmuUnlocked = useDanmuUnlocked();
  const setDanmuUnlocked = useSetDanmuUnlocked();

  const handleVersionPress = () => {
    if (danmuUnlocked) {
      toast.show("You are already a developer", undefined, {
        duration: 2,
        variant: "info",
        actionLabel: "Stop being a developer",
        onAction: () => {
          setDanmuUnlocked(false);
          toast.show("You are no longer a developer", undefined, {
            duration: 2,
            variant: "info",
          });
        },
      });
      return;
    }

    const newCount = tapCount + 1;
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
    <Pressable onPress={handleVersionPress}>
      <SettingsRowItem>
        <Text size="lg">{t("app-version", { version: pkg.version })}</Text>
      </SettingsRowItem>
    </Pressable>
  );
}
