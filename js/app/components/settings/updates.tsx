import { Text } from "@streamplace/components";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import pkg from "../../package.json";

// maybe someday some PWA update stuff will live here
export function Updates() {
  const { t } = useTranslation("settings");
  return (
    <View>
      <Text size="xl">{t("app-version", { version: pkg.version })}</Text>
    </View>
  );
}
