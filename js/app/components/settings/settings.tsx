import {
  Button,
  Input,
  Slider,
  Text,
  useDanmuSettings,
  View,
  zero,
} from "@streamplace/components";
import AQLink from "components/aqlink";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  ScrollView,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useStore } from "store";
import { useIsReady, useServerSettings } from "store/hooks";
import { DEFAULT_URL } from "store/slices/streamplaceSlice";
import { Updates } from "./updates";
import WebhookManager from "./webhook-manager";

export function Settings() {
  const setURL = useStore((state) => state.setURL);
  const { url } = useStreamplaceNode();
  const defaultUrl = DEFAULT_URL;
  const [newUrl, setNewUrl] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const { t } = useTranslation("settings");

  // are we logged in?
  const loggedIn = useStore((state) => state.authStatus === "loggedIn");

  // Initialize the override state based on current URL
  useEffect(() => {
    setOverrideEnabled(url !== defaultUrl);
  }, [url, defaultUrl]);

  const onSubmitUrl = () => {
    if (newUrl) {
      let trimmedUrl = newUrl.endsWith("/") ? newUrl.slice(0, -1) : newUrl;
      setURL(trimmedUrl);
      setNewUrl("");
    }
  };

  const handleToggleOverride = (enabled: boolean) => {
    setOverrideEnabled(enabled);
    if (!enabled) {
      setURL(defaultUrl);
    }
  };

  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[8], zero.py[4]]}>
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
                zero.gap.all[6],
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
                  <Text size="xl">{t("use-custom-node")}</Text>
                  <Text size="lg" color="muted">
                    {t("default-url", { url: defaultUrl })}
                  </Text>
                </View>
                <Switch
                  value={overrideEnabled}
                  onValueChange={handleToggleOverride}
                />
              </View>

              {overrideEnabled && (
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
                    <Input
                      value={newUrl}
                      containerStyle={[
                        { flex: 1, flexGrow: 1, width: "100%" },
                        zero.flex.grow[1],
                      ]}
                      variant="default"
                      numberOfLines={1}
                      multiline={false}
                      placeholder={t("enter-custom-node-url")}
                      placeholderTextColor="#999"
                      onChangeText={setNewUrl}
                      onSubmitEditing={onSubmitUrl}
                      textContentType="URL"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>
                  <Button size="md" variant="secondary" onPress={onSubmitUrl}>
                    <Text size="lg">{t("save-button")}</Text>
                  </Button>
                </View>
              )}
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
                  <Text>{t("manage-keys")}</Text>
                  <Text style={[{ fontSize: 16 }]}>→</Text>
                </View>
              </AQLink>
              <WebhookManager />
            </>
          )}

          <AQLink
            to={{
              screen: "Settings",
              params: {
                screen: "DeveloperSettings",
              },
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
              <Text>Developer Settings</Text>
              <Text style={[{ fontSize: 16 }]}>→</Text>
            </View>
          </AQLink>

          <DanmuSettings />
        </View>
      </View>
    </ScrollView>
  );
}

const DebugRecording = () => {
  const getServerSettingsFromPDS = useStore(
    (state) => state.getServerSettingsFromPDS,
  );
  const createServerSettingsRecord = useStore(
    (state) => state.createServerSettingsRecord,
  );
  const isReady = useIsReady();
  const serverSettings = useServerSettings();
  const { url } = useStreamplaceNode();
  const { t } = useTranslation();
  const debugRecordingOn = serverSettings?.debugRecording === true;

  useEffect(() => {
    if (isReady) {
      getServerSettingsFromPDS();
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
          <Text size="xl">{t("debug-recording-title", { host: u.host })}</Text>
          <Text size="lg" color="muted">
            {t("debug-recording-description")}
          </Text>
        </View>
        <Switch
          value={debugRecordingOn}
          onValueChange={(value) => {
            if (value === true) {
              createServerSettingsRecord(true);
            } else {
              createServerSettingsRecord(false);
            }
          }}
        />
      </View>
    </View>
  );
};

const DanmuSettings = () => {
  const {
    danmuUnlocked,
    danmuEnabled,
    danmuOpacity,
    danmuSpeed,
    danmuLaneCount,
    danmuMaxMessages,
    setDanmuEnabled,
    setDanmuOpacity,
    setDanmuSpeed,
    setDanmuLaneCount,
    setDanmuMaxMessages,
  } = useDanmuSettings();

  const { width } = useWindowDimensions();
  const isNarrowScreen = width < 550;

  if (!danmuUnlocked) return null;

  return (
    <View style={[{ alignItems: "stretch" }, zero.gap.all[4]]}>
      <View
        style={[
          { flexDirection: "row" },
          { alignItems: "flex-start" },
          { justifyContent: "flex-start" },
        ]}
      >
        <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
          <Text size="xl">Enable Danmu</Text>
          <Text size="lg" color="muted">
            Show "bullet comments" flying across the video.
          </Text>
        </View>
        <Switch value={danmuEnabled} onValueChange={setDanmuEnabled} />
      </View>

      {danmuEnabled && (
        <>
          <View style={[zero.gap.all[6]]}>
            <View
              style={[
                {
                  flexDirection: isNarrowScreen ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                },
                zero.gap.all[2],
              ]}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  },
                  zero.gap.all[2],
                ]}
              >
                <Text size="lg">Opacity:</Text>
                <Input
                  value={String(danmuOpacity)}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    setDanmuOpacity(Math.min(100, Math.max(0, val)));
                  }}
                  containerStyle={{ width: 60 }}
                  keyboardType="number-pad"
                />
                <Text size="lg">%</Text>
              </View>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                {[0, 25, 50, 75, 100].map((value) => (
                  <Button
                    key={value}
                    onPress={() => setDanmuOpacity(value)}
                    variant={danmuOpacity === value ? "primary" : "secondary"}
                    size="pill"
                  >
                    <Text size="lg">{value}</Text>
                  </Button>
                ))}
              </View>
            </View>
            {Platform.OS === "web" && (
              <Slider.Root
                // i think they typed this wrong in the lib?
                value={[danmuOpacity] as any}
                min={0}
                max={100}
                step={5}
                onValueChange={(vals) => setDanmuOpacity(vals[0])}
                style={{ width: "100%", height: 40 }}
              >
                <Slider.Track
                  style={{
                    height: 4,
                    backgroundColor: "#374151",
                    borderRadius: 2,
                    width: "100%",
                  }}
                >
                  <Slider.Range
                    style={{
                      height: 4,
                      backgroundColor: "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                  <Slider.Thumb
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#3b82f6",
                      transform: [{ translateY: -8 }],
                    }}
                  />
                </Slider.Track>
              </Slider.Root>
            )}
          </View>

          <View style={[zero.gap.all[6]]}>
            <View
              style={[
                {
                  flexDirection: isNarrowScreen ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                },
                zero.gap.all[2],
              ]}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                <Text size="lg">Speed: </Text>
                <Input
                  value={String(danmuSpeed)}
                  onChangeText={(text) => {
                    const val = parseFloat(text) || 0;
                    setDanmuSpeed(Math.min(3, Math.max(0.1, val)));
                  }}
                  containerStyle={{ width: 60 }}
                  keyboardType="numeric"
                />
                <Text size="lg">×</Text>
              </View>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                {[
                  { label: "0.5×", value: 0.5 },
                  { label: "1×", value: 1 },
                  { label: "1.5×", value: 1.5 },
                  { label: "2×", value: 2 },
                ].map(({ label, value }) => (
                  <Button
                    key={value}
                    onPress={() => setDanmuSpeed(value)}
                    variant={danmuSpeed === value ? "primary" : "secondary"}
                    size="pill"
                  >
                    <Text size="lg">{label}</Text>
                  </Button>
                ))}
              </View>
            </View>
            {Platform.OS === "web" && (
              <Slider.Root
                value={[danmuSpeed] as any}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(vals) => setDanmuSpeed(vals[0])}
                style={{ width: "100%", height: 40 }}
              >
                <Slider.Track
                  style={{
                    height: 4,
                    backgroundColor: "#374151",
                    borderRadius: 2,
                    width: "100%",
                  }}
                >
                  <Slider.Range
                    style={{
                      height: 4,
                      backgroundColor: "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                  <Slider.Thumb
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#3b82f6",
                      transform: [{ translateY: -8 }],
                    }}
                  />
                </Slider.Track>
              </Slider.Root>
            )}
          </View>

          <View style={[zero.gap.all[6]]}>
            <View
              style={[
                {
                  flexDirection: isNarrowScreen ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                },
                zero.gap.all[2],
              ]}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                <Text size="lg">Lanes: </Text>
                <Input
                  value={String(danmuLaneCount)}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    setDanmuLaneCount(Math.min(20, Math.max(4, val)));
                  }}
                  containerStyle={{ width: 60 }}
                  keyboardType="number-pad"
                />
              </View>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                {[6, 8, 10, 12, 15].map((value) => (
                  <Button
                    key={value}
                    onPress={() => setDanmuLaneCount(value)}
                    variant={danmuLaneCount === value ? "primary" : "secondary"}
                    size="pill"
                  >
                    <Text size="lg">{value}</Text>
                  </Button>
                ))}
              </View>
            </View>
            {Platform.OS === "web" && (
              <Slider.Root
                value={[danmuLaneCount] as any}
                min={4}
                max={20}
                step={1}
                onValueChange={(vals) => setDanmuLaneCount(vals[0])}
                style={{ width: "100%", height: 40 }}
              >
                <Slider.Track
                  style={{
                    height: 4,
                    backgroundColor: "#374151",
                    borderRadius: 2,
                    width: "100%",
                  }}
                >
                  <Slider.Range
                    style={{
                      height: 4,
                      backgroundColor: "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                  <Slider.Thumb
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#3b82f6",
                      transform: [{ translateY: -8 }],
                    }}
                  />
                </Slider.Track>
              </Slider.Root>
            )}
          </View>

          <View style={[zero.gap.all[6]]}>
            <View
              style={[
                {
                  flexDirection: isNarrowScreen ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                },
                zero.gap.all[2],
              ]}
            >
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                <Text size="lg">Max Messages: </Text>
                <Input
                  value={String(danmuMaxMessages)}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    setDanmuMaxMessages(Math.min(200, Math.max(5, val)));
                  }}
                  containerStyle={{ width: 60 }}
                  keyboardType="number-pad"
                />
              </View>
              <View
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                  },
                  zero.gap.all[2],
                ]}
              >
                {[10, 25, 50, 100].map((value) => (
                  <Button
                    key={value}
                    onPress={() => setDanmuMaxMessages(value)}
                    variant={
                      danmuMaxMessages === value ? "primary" : "secondary"
                    }
                    size="pill"
                  >
                    <Text size="lg">{value}</Text>
                  </Button>
                ))}
              </View>
            </View>
            {Platform.OS === "web" && (
              <Slider.Root
                value={[danmuMaxMessages] as any}
                min={5}
                max={200}
                step={5}
                onValueChange={(vals) => setDanmuMaxMessages(vals[0])}
                style={{ width: "100%", height: 40 }}
              >
                <Slider.Track
                  style={{
                    height: 4,
                    backgroundColor: "#374151",
                    borderRadius: 2,
                    width: "100%",
                  }}
                >
                  <Slider.Range
                    style={{
                      height: 4,
                      backgroundColor: "#3b82f6",
                      borderRadius: 2,
                    }}
                  />
                  <Slider.Thumb
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#3b82f6",
                      transform: [{ translateY: -8 }],
                    }}
                  />
                </Slider.Track>
              </Slider.Root>
            )}
          </View>
        </>
      )}
    </View>
  );
};
