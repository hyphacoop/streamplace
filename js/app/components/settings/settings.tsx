import {
  MenuContainer,
  MenuGroup,
  MenuInfo,
  MenuItem,
  MenuSeparator,
  Text,
  useDanmuUnlocked,
  useTranslation,
  View,
  zero,
} from "@streamplace/components";
import AQLink from "components/aqlink";
import { SettingsNavigationItem } from "components/settings/components/settings-navigation-item";
import { Globe, Info, Lock, LogIn, Shield, Video } from "lucide-react-native";
import { ImageBackground, Pressable, ScrollView } from "react-native";

import Mu from "components/mobile/desktop-ui/mu";
import { useStore } from "store";
import { useUserProfile } from "store/hooks";
import pkg from "../../package.json";

export function Settings() {
  const loggedIn = useStore((state) => state.authStatus === "loggedIn");
  const userProfile = useUserProfile();
  const danmuUnlocked = useDanmuUnlocked();
  const { t } = useTranslation("settings");

  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[2], zero.py[2]]}>
        <View style={[{ maxWidth: 500, width: "100%" }]}>
          <MenuContainer>
            <MenuGroup>
              {loggedIn && userProfile ? (
                <MenuItem>
                  <View
                    style={[
                      zero.layout.flex.row,
                      zero.layout.flex.align.center,
                      zero.gap.all[4],
                      zero.py[2],
                    ]}
                  >
                    <ImageBackground
                      source={{ uri: userProfile.avatar }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        overflow: "hidden",
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text size="2xl" leading="tight">
                        @{userProfile.handle}
                      </Text>
                    </View>
                  </View>
                </MenuItem>
              ) : (
                <AQLink to={{ screen: "Login" }}>
                  <Pressable>
                    {({ pressed }) => (
                      <MenuItem>
                        <View
                          style={[
                            zero.layout.flex.row,
                            zero.layout.flex.align.center,
                            zero.gap.all[4],
                            zero.py[2],
                          ]}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              backgroundColor: "#333",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <LogIn size={24} color="#999" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text size="xl" style={{ fontWeight: "600" }}>
                              {t("sign-in")}
                            </Text>
                          </View>
                        </View>
                      </MenuItem>
                    )}
                  </Pressable>
                </AQLink>
              )}
            </MenuGroup>

            {loggedIn && (
              <MenuGroup>
                <SettingsNavigationItem
                  title={t("streaming")}
                  screen="StreamingCategory"
                  icon={Video}
                />
                <MenuSeparator />
                <SettingsNavigationItem
                  title={t("privacy-security")}
                  screen="PrivacyCategory"
                  icon={Shield}
                />
              </MenuGroup>
            )}
            {danmuUnlocked && (
              <MenuGroup>
                <SettingsNavigationItem
                  title={t("danmu")}
                  screen="DanmuCategory"
                  icon={Mu as any}
                />
              </MenuGroup>
            )}
            <MenuGroup>
              <SettingsNavigationItem
                title={t("languages")}
                screen="LanguagesCategory"
                icon={Globe}
              />
              <MenuSeparator />
              <SettingsNavigationItem
                title={t("advanced")}
                screen="AdvancedCategory"
                icon={Lock}
              />
              <MenuSeparator />
              <SettingsNavigationItem
                title={t("about")}
                screen="AboutCategory"
                icon={Info}
              />
            </MenuGroup>
            <MenuInfo
              description={t("app-version", { version: pkg.version })}
            />
          </MenuContainer>
        </View>
      </View>
    </ScrollView>
  );
}
