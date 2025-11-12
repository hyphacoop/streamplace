import {
  Button,
  MenuItem,
  Text,
  useDanmuUnlocked,
  useSetDanmuUnlocked,
  useTheme,
  useToast,
  View,
  zero,
} from "@streamplace/components";
import * as ExpoUpdates from "expo-updates";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, TouchableOpacity } from "react-native";
import pkg from "../../package.json";

const UNLOCK_TAP_COUNT = 5;

export function Updates() {
  const theme = useTheme();
  const version = pkg.version;
  const updateInfo = ExpoUpdates.useUpdates();
  const { currentlyRunning, isUpdateAvailable, isUpdatePending } = updateInfo;
  const toast = useToast();
  const { t } = useTranslation("settings");

  console.log(`updateInfo: ${JSON.stringify(updateInfo)}`);

  const [checked, setChecked] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const danmuUnlocked = useDanmuUnlocked();
  const setDanmuUnlocked = useSetDanmuUnlocked();

  useEffect(() => {
    if (isUpdateAvailable && checked) {
      ExpoUpdates.fetchUpdateAsync();
    }
  }, [isUpdateAvailable, checked]);

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

  // If true, we show the button to download and run the update
  const buttonText = isUpdateAvailable
    ? t("download-new-update")
    : t("check-for-updates");

  // Show whether or not we are running embedded code or an update
  let runTypeMessage = currentlyRunning.isEmbeddedLaunch
    ? t("bundled-runtype")
    : t("ota-runtype");
  if (currentlyRunning.isEmergencyLaunch) {
    runTypeMessage = t("recovery-runtype");
  }

  return (
    <>
      <MenuItem onPress={handleVersionPress}>
        <View style={[zero.gap.all[1], { flex: 1 }]}>
          <Text size="base" style={[{ fontWeight: "bold" }]}>
            Streamplace v{version}
          </Text>
          <Text size="sm" color="muted">
            {runTypeMessage}
          </Text>
        </View>
      </MenuItem>
      <View style={[zero.mt[3]]}>
        <Button
          variant="secondary"
          width="full"
          onPress={async () => {
            try {
              setChecked(true);
              const res = await ExpoUpdates.checkForUpdateAsync();
              if (!res.isAvailable) {
                toast.show(
                  t("modal-latest-version"),
                  t("modal-no-update-available"),
                  { duration: 2000 },
                );
              } else {
                toast.show(
                  t("modal-update-available-title"),
                  t("modal-update-available-description"),
                  { duration: 2000 },
                );
              }
            } catch (e) {
              toast.show(
                t("modal-update-failed-title"),
                t("modal-update-failed-description", {
                  store: Platform.OS === "ios" ? "App Store" : "Play Store",
                }),
              );
            }
          }}
        >
          <Text>{buttonText}</Text>
        </Button>
        {isUpdatePending && (
          <TouchableOpacity
            style={[
              {
                marginTop: 8,
                backgroundColor: "#007AFF",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
              },
            ]}
            onPress={() => {
              ExpoUpdates.reloadAsync();
            }}
          >
            <Text color="secondary" style={[{ fontWeight: "600" }]}>
              {t("button-reload-app-on-update")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}
