import { Text, View, zero } from "@streamplace/components";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { Updates } from "./updates";

let buildInfo: {
  hash: string;
  shortHash: string;
  branch: string;
  tag: string;
  isDirty: boolean;
  buildTime: string;
} | null = null;

try {
  buildInfo = require("../../src/build-info.json");
} catch {
  // build-info.json doesn't exist in dev mode
}

export function AboutCategorySettings() {
  const { t } = useTranslation("settings");

  const getBuildStatus = () => {
    if (!buildInfo) {
      return "dev";
    }
    return buildInfo.isDirty || process?.env.NODE_ENV === "development"
      ? "dev"
      : "prod";
  };

  const buildLabel = buildInfo ? buildInfo.tag : "development";
  const buildStatus = getBuildStatus();

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
            <Text>This version is </Text>
            <Updates />
          </View>

          <View
            style={[
              { flexDirection: "row" },
              { alignItems: "flex-start" },
              { justifyContent: "flex-start" },
            ]}
          >
            <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
              <Text size="lg">Build</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text size="lg" color="muted">
                {buildLabel} ({buildStatus})
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
