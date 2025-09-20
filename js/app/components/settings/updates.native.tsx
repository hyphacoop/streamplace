import { Text } from "@streamplace/components";
import * as ExpoUpdates from "expo-updates";
import { useEffect, useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import pkg from "../../package.json";

export function Updates() {
  const version = pkg.version;
  const updateInfo = ExpoUpdates.useUpdates();
  const { currentlyRunning, isUpdateAvailable, isUpdatePending } = updateInfo;

  console.log(`updateInfo: ${JSON.stringify(updateInfo)}`);

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable && checked) {
      ExpoUpdates.fetchUpdateAsync();
    }
  }, [isUpdateAvailable, checked]);

  // If true, we show the button to download and run the update
  const showDownloadButton = isUpdateAvailable;
  const buttonText = isUpdateAvailable
    ? "Download new update"
    : "Check for updates";

  // Show whether or not we are running embedded code or an update
  let runTypeMessage = currentlyRunning.isEmbeddedLaunch ? "Bundled" : "OTA";
  if (currentlyRunning.isEmergencyLaunch) {
    runTypeMessage = "Recovery";
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
                // Removed toast functionality - replaced with console.log
                console.log(
                  "No update found - You are on the latest version of Streamplace, hooray!",
                );
              }
            } catch (e) {
              // Removed toast functionality - replaced with console.log
              console.log(
                `Update failed! You may need to update the app through the ${Platform.OS === "ios" ? "App" : "Play"} Store.`,
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
              Reload app for new version
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
