import { Text, View, zero } from "@streamplace/components";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch } from "react-native";
import { useStore } from "store";
import { useIsReady, useServerSettings, useStreamplaceUrl } from "store/hooks";

export function PrivacyCategorySettings() {
  const { t } = useTranslation("settings");
  const isReady = useIsReady();
  const serverSettings = useServerSettings();
  const url = useStreamplaceUrl();
  const getServerSettingsFromPDS = useStore(
    (state) => state.getServerSettingsFromPDS,
  );
  const createServerSettingsRecord = useStore(
    (state) => state.createServerSettingsRecord,
  );
  const debugRecordingOn = serverSettings?.debugRecording === true;

  useEffect(() => {
    if (isReady) {
      getServerSettingsFromPDS();
    }
  }, [isReady]);

  const u = new URL(url);

  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[8], zero.py[4]]}>
        <View
          style={[
            zero.gap.all[12],
            { paddingVertical: 24, maxWidth: 500, width: "100%" },
          ]}
        >
          <View
            style={[
              zero.layout.flex.row,
              zero.layout.flex.align.center,
              zero.layout.flex.justify.between,
              { width: "100%" },
            ]}
          >
            <View style={[zero.flex.values[1], { paddingRight: 12 }]}>
              <Text size="xl">
                {t("debug-recording-title", { host: u.host })}
              </Text>
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
      </View>
    </ScrollView>
  );
}
