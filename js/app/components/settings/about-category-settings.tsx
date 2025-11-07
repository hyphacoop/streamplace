import { Text, View, zero } from "@streamplace/components";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import pkg from "../../package.json";

export function AboutCategorySettings() {
  const { t } = useTranslation("settings");

  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[4], zero.py[4]]}>
        <View
          style={[
            zero.gap.all[4],
            { paddingVertical: 24, maxWidth: 500, width: "100%" },
          ]}
        >
          <View>
            <Text size="xl">{t("app-version", { version: pkg.version })}</Text>
            <Text size="lg" color="muted">
              {t("app-version-description")}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
