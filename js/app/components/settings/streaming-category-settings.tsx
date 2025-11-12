import { MenuGroup, MenuSeparator, View, zero } from "@streamplace/components";
import { Key, Webhook } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { SettingsNavigationItem } from "./components/settings-navigation-item";

export function StreamingCategorySettings() {
  const { t } = useTranslation("settings");
  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[2], zero.py[2]]}>
        <View style={{ paddingVertical: 0, maxWidth: 500, width: "100%" }}>
          <MenuGroup>
            <SettingsNavigationItem
              title={t("key-management")}
              screen="KeyManagement"
              icon={Key}
            />
            <MenuSeparator />
            <SettingsNavigationItem
              title={t("webhooks")}
              screen="WebhooksSettings"
              icon={Webhook}
            />
          </MenuGroup>
        </View>
      </View>
    </ScrollView>
  );
}
