import { Text, useToast } from "@streamplace/components";
import * as ExpoUpdates from "expo-updates";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, TouchableOpacity, View } from "react-native";
import pkg from "../../package.json";

export function Updates() {
  const version = pkg.version;
  const updateInfo = ExpoUpdates.useUpdates();
  const { currentlyRunning, isUpdateAvailable, isUpdatePending } = updateInfo;
  const toast = useToast();
  const { t } = useTranslation();

  console.log(`updateInfo: ${JSON.stringify(updateInfo)}`);

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable && checked) {
      ExpoUpdates.fetchUpdateAsync();
    }
  }, [isUpdateAvailable, checked]);

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
    <View
      style={[
        { flex: 1 },
        { alignItems: "center" },
        { justifyContent: "center" },
        { flexBasis: 0 },
      ]}
    >
      <View>
        <Text
          style={[
            {
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              color: "#fff",
            },
          ]}
        >
          Streamplace v{version}
        </Text>
        <Text
          style={[
            {
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
              paddingBottom: 20,
              color: "#fff",
            },
          ]}
        >
          {runTypeMessage}
        </Text>
        <TouchableOpacity
          style={[
            {
              backgroundColor: "#007AFF",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              alignItems: "center",
            },
          ]}
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
          <Text style={[{ color: "#fff", fontWeight: "600" }]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
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
            <Text style={[{ color: "#fff", fontWeight: "600" }]}>
              {t("button-reload-app-on-update")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
