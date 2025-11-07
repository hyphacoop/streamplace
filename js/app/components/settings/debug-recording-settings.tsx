import { Text, View, zero } from "@streamplace/components";
import {
  createServerSettingsRecord,
  getServerSettingsFromPDS,
  selectIsReady,
  selectServerSettings,
} from "features/bluesky/blueskySlice";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";

export function DebugRecordingSettings() {
  const dispatch = useAppDispatch();
  const isReady = useAppSelector(selectIsReady);
  const serverSettings = useAppSelector(selectServerSettings);
  const { url } = useStreamplaceNode();
  const { t } = useTranslation("settings");
  const debugRecordingOn = serverSettings?.debugRecording === true;

  useEffect(() => {
    if (isReady) {
      dispatch(getServerSettingsFromPDS());
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
              { alignItems: "center" },
              { justifyContent: "space-between" },
              { width: "100%", flexDirection: "row" },
            ]}
          >
            <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
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
      </View>
    </ScrollView>
  );
}
