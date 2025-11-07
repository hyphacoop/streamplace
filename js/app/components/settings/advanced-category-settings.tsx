import { Button, Input, Text, View, zero } from "@streamplace/components";
import { DEFAULT_URL, setURL } from "features/streamplace/streamplaceSlice";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch } from "react-native";
import { useAppDispatch } from "store/hooks";

export function AdvancedCategorySettings() {
  const dispatch = useAppDispatch();
  const { url } = useStreamplaceNode();
  const defaultUrl = DEFAULT_URL;
  const [newUrl, setNewUrl] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const { t } = useTranslation("settings");

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
      <View style={[zero.layout.flex.align.center, zero.px[8], zero.py[4]]}>
        <View
          style={[
            zero.gap.all[12],
            { paddingVertical: 24, maxWidth: 500, width: "100%" },
          ]}
        >
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
        </View>
      </View>
    </ScrollView>
  );
}
