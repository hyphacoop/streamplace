import { View, zero } from "@streamplace/components";
import { SettingsItemLink } from "components/settings/settings-item-link";
import { Key, Webhook } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

export function StreamingCategorySettings() {
  const { t } = useTranslation("settings");
  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[2], zero.py[4]]}>
        <View
          style={[
            zero.gap.all[4],
            { paddingVertical: 24, maxWidth: 500, width: "100%" },
          ]}
        >
          <SettingsItemLink
            title={t("key-management")}
            screen="KeyManagement"
            icon={Key}
            rootScreen
          />
          <SettingsItemLink
            title={t("webhooks")}
            screen="WebhooksSettings"
            icon={Webhook}
          />
        </View>
      </View>
    </ScrollView>
  );
}
