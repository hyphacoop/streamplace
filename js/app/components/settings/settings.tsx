import {
  Text,
  useDanmuUnlocked,
  useTranslation,
  View,
  zero,
} from "@streamplace/components";
import AQLink from "components/aqlink";
import { SettingsNavigationItem } from "components/settings/settings-navigation-item";
import { Code, Info, Lock, LogIn, Shield, Video } from "lucide-react-native";
import { ImageBackground, Pressable, ScrollView } from "react-native";

import { ml, mt } from "@streamplace/components/src/ui";
import Mu from "components/mobile/desktop-ui/mu";
import { useStore } from "store";
import { useUserProfile } from "store/hooks";
import pkg from "../../package.json";

function HorizontalBar() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "#ffffff11",
        alignSelf: "stretch",
      }}
    />
  );
}

export function Settings() {
  // are we logged in?
  const loggedIn = useStore((state) => state.authStatus === "loggedIn");
  const userProfile = useUserProfile();
  const danmuUnlocked = useDanmuUnlocked();
  const { t } = useTranslation("settings");

  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[2], zero.py[2]]}>
        <View style={[{ paddingVertical: 0, maxWidth: 500, width: "100%" }]}>
          {loggedIn && userProfile ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 16,
                paddingHorizontal: 16,
              }}
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
          ) : (
            <AQLink to={{ screen: "Login" }}>
              <Pressable>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      backgroundColor: pressed ? "#ffffff08" : "transparent",
                    }}
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
                )}
              </Pressable>
            </AQLink>
          )}

          <HorizontalBar />

          {loggedIn && (
            <>
              <SettingsNavigationItem
                title={t("streaming")}
                screen="StreamingCategory"
                icon={Video}
              />
              <HorizontalBar />
              <SettingsNavigationItem
                title={t("privacy-security")}
                screen="PrivacyCategory"
                icon={Shield}
              />
              <HorizontalBar />
            </>
          )}
          {danmuUnlocked && (
            <>
              <SettingsNavigationItem
                title={t("danmu")}
                screen="DanmuCategory"
                icon={Mu as any}
              />
              <HorizontalBar />
            </>
          )}
          <SettingsNavigationItem
            title={t("advanced")}
            screen="AdvancedCategory"
            icon={Lock}
          />
          <HorizontalBar />
          <SettingsNavigationItem
            title={t("developer")}
            screen="DeveloperSettings"
            icon={Code}
          />
          <HorizontalBar />
          <SettingsNavigationItem
            title={t("about")}
            screen="AboutCategory"
            icon={Info}
          />
          <Text muted style={[mt[2], ml[4]]}>
            {t("app-version", { version: pkg.version })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
