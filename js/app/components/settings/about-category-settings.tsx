import {
  MenuContainer,
  MenuGroup,
  MenuSeparator,
  Text,
  useTheme,
  View,
  zero,
} from "@streamplace/components";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import {
  SettingsExternalItem,
  SettingsRowItem,
} from "./components/settings-navigation-item";
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

const VERSION_REGEX = /^v?(\d+\.\d+\.\d+)(-.+)?$/;
function cutVersionPrefix(version: string) {
  if (VERSION_REGEX.test(version)) {
    const match = VERSION_REGEX.exec(version);
    if (match && match[1]) {
      return match[1];
    }
  }
  return version;
}

export function AboutCategorySettings() {
  const { t } = useTranslation("settings");
  const theme = useTheme();

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
      <View style={[zero.layout.flex.align.center, zero.px[2], zero.py[4]]}>
        <MenuContainer
          style={{ paddingVertical: 24, maxWidth: 500, width: "100%" }}
        >
          <MenuGroup>
            <Updates />
          </MenuGroup>

          <MenuGroup>
            <SettingsRowItem>
              <View style={{ flex: 1 }}>
                <Text size="lg">Build</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text size="lg" color="muted">
                  {buildLabel} ({buildStatus})
                </Text>
              </View>
            </SettingsRowItem>
            <MenuSeparator />
            <SettingsExternalItem
              title="Terms of Service"
              link="OpenSourceLicenses"
            />
            <MenuSeparator />
            <SettingsExternalItem
              title="Privacy Policy"
              link="OpenSourceLicenses"
            />
          </MenuGroup>
        </MenuContainer>
      </View>
    </ScrollView>
  );
}
