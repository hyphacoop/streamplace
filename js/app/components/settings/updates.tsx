import { Text } from "@streamplace/components";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import pkg from "../../package.json";

// maybe someday some PWA update stuff will live here
export function Updates() {
  const { t } = useTranslation();
  return (
    <View
      style={[
        { alignItems: "center" },
        { justifyContent: "center" },
        { paddingVertical: 24 },
      ]}
    >
      <View>
        <Text
          size="2xl"
          style={[
            {
              fontWeight: "bold",
              textAlign: "center",
              color: "#fff",
            },
          ]}
        >
          {t("app-version", { version: pkg.version })}
        </Text>
      </View>
    </View>
  );
}
