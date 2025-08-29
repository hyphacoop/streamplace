import { useNavigation } from "@react-navigation/native";
import {
  Button,
  Input,
  Localized,
  Text,
  View,
  zero,
} from "@streamplace/components";
import AQLink from "components/aqlink";
import {
  createServerSettingsRecord,
  getServerSettingsFromPDS,
  selectIsReady,
  selectServerSettings,
} from "features/bluesky/blueskySlice";
import { DEFAULT_URL, setURL } from "features/streamplace/streamplaceSlice";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useEffect, useState } from "react";
import { ScrollView, Switch } from "react-native";
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
      <View style={[zero.layout.flex.align.center, zero.px[16], zero.py[24]]}>
        <View
          style={[
            zero.gap.all[12],
            { paddingVertical: 24, maxWidth: 500, width: "100%" },
          ]}
        >
          <View>
            <Updates />
          </View>

          <View
            style={[
              { alignItems: "stretch" },
              zero.layout.flex.justify.center,
              zero.gap.all[8],
            ]}
          >
            <View
              style={[
                { alignItems: "stretch" },
                zero.layout.flex.justify.start,
                zero.w.percent[100],
                zero.gap.all[4],
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
                  <Localized id="use-custom-node">
                    <Text size="xl">Use Custom Node</Text>
                  </Localized>
                  <Localized id="default-url" vars={{ url: defaultUrl }}>
                    <Text size="lg" color="muted">
                      Default: {defaultUrl}
                    </Text>
                  </Localized>
                </View>
                <Switch
                  value={overrideEnabled}
                  onValueChange={handleToggleOverride}
                />
              </View>
              <View
                style={[
                  {
                    opacity: overrideEnabled ? 1 : 0,
                    height: overrideEnabled ? "auto" : 0,
                  },
                  zero.gap.all[2],
                  zero.layout.flex.align.center,
                  zero.layout.flex.row,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Localized
                    id="enter-custom-node-url"
                    attrs={{ placeholder: true }}
                  >
                    <Input
                      value={newUrl}
                      containerStyle={[
                        { flex: 1, flexGrow: 1, width: "100%" },
                        zero.flex.grow[1],
                      ]}
                      variant="default"
                      numberOfLines={1}
                      multiline={false}
                      placeholder={url || undefined}
                      placeholderTextColor="#999"
                      onChangeText={setNewUrl}
                      onSubmitEditing={onSubmitUrl}
                      textContentType="URL"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </Localized>
                </View>
                <Button size="md" variant="secondary" onPress={onSubmitUrl}>
                  <Localized id="save-button">
                    <Text size="lg">Save</Text>
                  </Localized>
                </Button>
              </View>
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
                  <Localized id="manage-keys">
                    <Text>Manage Keys</Text>
                  </Localized>
                  <Text style={[{ fontSize: 16 }]}>→</Text>
                </View>
              </AQLink>
              <WebhookManager />
            </>
          )}
        </View>
      </View>
    </ScrollView>
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
          <Localized id="debug-recording-title" vars={{ host: u.host }}>
            <Text size="xl">
              Allow {u.host} to record your livestream for debugging and
              improving the service
            </Text>
          </Localized>
          <Localized id="debug-recording-description">
            <Text size="lg" color="muted">
              Optional
            </Text>
          </Localized>
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
