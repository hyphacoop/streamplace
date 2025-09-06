import { useNavigation } from "@react-navigation/native";
import { Text } from "@streamplace/components";
import AQLink from "components/aqlink";
import Container from "components/container";
import {
  createServerSettingsRecord,
  getServerSettingsFromPDS,
  selectIsReady,
  selectServerSettings,
} from "features/bluesky/blueskySlice";
import { DEFAULT_URL, setURL } from "features/streamplace/streamplaceSlice";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useEffect, useState } from "react";
import { Switch, TextInput, TouchableOpacity, View } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Updates } from "./updates";
import WebhookManager from "./webhook-manager";

export function Settings() {
  const dispatch = useAppDispatch();
  const { url } = useStreamplaceNode();
  const defaultUrl = DEFAULT_URL;
  const [newUrl, setNewUrl] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(false);

  // are we logged in?
  const loggedIn = useAppSelector(
    (state) => state.bluesky.status === "loggedIn",
  );

  const navigate = useNavigation();

  // Initialize the override state based on current URL
  useEffect(() => {
    setOverrideEnabled(url !== defaultUrl);
  }, [url, defaultUrl]);

  const onSubmitUrl = () => {
    if (newUrl) {
      let trimmedUrl = newUrl.endsWith("/") ? newUrl.slice(0, -1) : newUrl;
      dispatch(setURL(trimmedUrl));
      setNewUrl("");
    }
  };

  const handleToggleOverride = (enabled: boolean) => {
    setOverrideEnabled(enabled);
    if (!enabled) {
      dispatch(setURL(defaultUrl));
    }
  };

  return (
    <ScrollView>
      <Container alignItems="center" justifyContent="center">
        <View
          f={1}
          alignItems="stretch"
          justifyContent="flex-start"
          mt="$8"
          maxWidth={500}
          $platform-web={{ width: "100%" }}
          gap="$6"
        >
          <View maxHeight={200}>
            <Updates />
          </View>

        <View
          style={[
            { alignItems: "stretch" },
            { justifyContent: "flex-start" },
            { gap: 16 },
          ]}
        >
          <View
            style={[
              { alignItems: "stretch" },
              { justifyContent: "flex-start" },
              { width: "100%", flexDirection: "column" },
            ]}
          >
            <View
              style={[
                { flexDirection: "row" },
                { alignItems: "flex-start" },
                { justifyContent: "flex-start" },
              ]}
            >
              <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
                <Text
                  style={[{ fontSize: 28, fontWeight: "bold", color: "#fff" }]}
                >
                  Use Custom Node
                </Text>
                <Text style={[{ fontSize: 20, color: "#999" }]}>
                  Default: {url}
                </Text>
              </View>
              <Switch
                value={overrideEnabled}
                onValueChange={handleToggleOverride}
              />
            </View>
          </View>

          {/* Custom URL Input Row */}
          <View
            style={[
              { alignItems: "center" },
              {
                gap: 8,
                opacity: overrideEnabled ? 1 : 0,
                height: overrideEnabled ? "auto" : 0,
                overflow: "hidden",
                flexDirection: "row",
              },
            ]}
          >
            <TextInput
              value={newUrl}
              style={[
                { flex: 1 },
                {
                  height: 40,
                  borderWidth: 1,
                  borderColor: "#333",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                  fontSize: 16,
                },
              ]}
              placeholder={url || "Enter custom node URL"}
              placeholderTextColor="#999"
              onChangeText={setNewUrl}
              onSubmitEditing={onSubmitUrl}
              textContentType="URL"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={[
                {
                  height: 40,
                  paddingHorizontal: 16,
                  backgroundColor: "#007AFF",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              onPress={onSubmitUrl}
            >
              <Text style={[{ color: "#fff", fontWeight: "600" }]}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loggedIn && (
          <>
            <DebugRecording />
            <AQLink
              to={{
                screen: "KeyManagement",
              }}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#333",
                    padding: 8,
                    borderRadius: 16,
                    backgroundColor: "#1a1a1a",
                  },
                ]}
              >
                <Text
                  style={[{ fontSize: 18, fontWeight: "600", color: "#fff" }]}
                >
                  Manage Keys
                </Text>
                <Text style={[{ fontSize: 16 }]}>→</Text>
              </View>
            </AQLink>
          </>
        )}
      </View>
    </Container>
  );
}

const DebugRecording = () => {
  const dispatch = useAppDispatch();
  const isReady = useAppSelector(selectIsReady);
  const serverSettings = useAppSelector(selectServerSettings);
  const { url } = useStreamplaceNode();
  const debugRecordingOn = serverSettings?.debugRecording === true;

  useEffect(() => {
    if (isReady) {
      dispatch(getServerSettingsFromPDS());
    }
  }, [isReady]);

  const u = new URL(url);
  return (
    <View
      style={[
        { alignItems: "center" },
        { justifyContent: "center" },
        { gap: 16 },
      ]}
    >
      <View
        style={[
          { alignItems: "center" },
          { justifyContent: "space-between" },
          { width: "100%", flexDirection: "row" },
        ]}
      >
        <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
          <Text style={[{ fontSize: 32, fontWeight: "bold", color: "#fff" }]}>
            Allow {u.host} to record your livestream for debugging and improving
            the service
          </Text>
          <Text style={[{ fontSize: 20, color: "#999" }]}>Optional</Text>
        </View>
        <Switch
          value={debugRecordingOn}
          onValueChange={(value) => {
            if (value === true) {
              dispatch(
                createServerSettingsRecord({
                  ...serverSettings,
                  debugRecording: true,
                }),
              );
            } else {
              dispatch(
                createServerSettingsRecord({
                  ...serverSettings,
                  debugRecording: false,
                }),
              );
            }
          }}
        />
      </View>
    </View>
  );
};
