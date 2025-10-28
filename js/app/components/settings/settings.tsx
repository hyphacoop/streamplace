import {
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  manifest,
  ResponsiveDropdownMenuContent,
  Text,
  View,
  zero,
} from "@streamplace/components";
import AQLink from "components/aqlink";
import {
  createServerSettingsRecord,
  getServerSettingsFromPDS,
  selectIsReady,
  selectServerSettings,
} from "features/bluesky/blueskySlice";
import { DEFAULT_URL, setURL } from "features/streamplace/streamplaceSlice";
import useStreamplaceNode from "hooks/useStreamplaceNode";
import { Check, ChevronDown } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Switch } from "react-native";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Updates } from "./updates";
import WebhookManager from "./webhook-manager";

export function Settings() {
  const dispatch = useAppDispatch();
  const { url } = useStreamplaceNode();
  const defaultUrl = DEFAULT_URL;
  const [newUrl, setNewUrl] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");
  const { t, i18n } = useTranslation("settings");

  // are we logged in?
  const loggedIn = useAppSelector(
    (state) => state.bluesky.status === "loggedIn",
  );

  // Initialize the override state based on current URL
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

  const filteredLanguages = Object.entries(manifest.languages).filter(
    ([code, info]) =>
      languageSearchQuery === "" ||
      info.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
      info.nativeName
        .toLowerCase()
        .includes(languageSearchQuery.toLowerCase()) ||
      code.toLowerCase().includes(languageSearchQuery.toLowerCase()),
  );

  return (
    <ScrollView>
      <View style={[zero.layout.flex.align.center, zero.px[8], zero.py[4]]}>
        <View
          style={[
            zero.gap.all[12],
            { paddingVertical: 24, maxWidth: 500, width: "100%" },
          ]}
        >
          <View>
            <Updates />
          </View>

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

          <View>
            <Text size="xl">{t("language-selection")}</Text>
            <Text size="lg" color="muted">
              {t("language-selection-description")}
            </Text>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <View
                  style={{
                    width: "100%",
                    padding: 8,
                    borderWidth: 1,
                    borderColor: "#bbbbbb55",
                    borderRadius: 8,
                    minHeight: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 8,
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Text>
                      {manifest.languages[
                        i18n.language as keyof typeof manifest.languages
                      ]?.flag || "🌍"}{" "}
                      {manifest.languages[
                        i18n.language as keyof typeof manifest.languages
                      ]?.nativeName || i18n.language}
                    </Text>
                    <ChevronDown />
                  </View>
                </View>
              </DropdownMenuTrigger>

              <ResponsiveDropdownMenuContent>
                <ScrollView
                  stickyHeaderIndices={[0]}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: "60vh" } as any}
                >
                  <View
                    style={{
                      paddingVertical: 8,
                    }}
                  >
                    <Input
                      placeholder={t("input-search-languages")}
                      variant="filled"
                      value={languageSearchQuery}
                      onChangeText={setLanguageSearchQuery}
                      size="sm"
                    />
                  </View>

                  <DropdownMenuGroup>
                    {filteredLanguages.map(([code, info], i) => (
                      <React.Fragment key={code}>
                        <DropdownMenuItem
                          onPress={() => {
                            i18n.changeLanguage(code);
                            setLanguageSearchQuery("");
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Text>{info.flag}</Text>
                              <View
                                style={{
                                  paddingVertical:
                                    info.name === info.nativeName ? 6 : 0,
                                }}
                              >
                                <Text
                                  style={{
                                    fontWeight:
                                      i18n.language === code
                                        ? "bold"
                                        : "normal",
                                    lineHeight: 18,
                                  }}
                                >
                                  {info.nativeName}
                                </Text>
                                {info.name !== info.nativeName && (
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      opacity: 0.7,
                                      lineHeight: 18,
                                    }}
                                  >
                                    {info.name}
                                  </Text>
                                )}
                              </View>
                            </View>
                            {i18n.language === code && (
                              <Text
                                style={{
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              >
                                <Check />
                              </Text>
                            )}
                          </View>
                        </DropdownMenuItem>
                        {i < filteredLanguages.length - 1 && (
                          <DropdownMenuSeparator />
                        )}
                      </React.Fragment>
                    ))}

                    {filteredLanguages.length === 0 && (
                      <View style={{ padding: 12 }}>
                        <Text style={{ opacity: 0.7, textAlign: "center" }}>
                          No languages found
                        </Text>
                      </View>
                    )}
                  </DropdownMenuGroup>
                </ScrollView>
              </ResponsiveDropdownMenuContent>
            </DropdownMenu>
          </View>

          {loggedIn && (
            <>
              <DebugRecording />
              <AQLink
                to={{
                  screen: "KeyManagement",
                }}
              >
                <View
                  style={[
                    {
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#333",
                      padding: 8,
                      borderRadius: 16,
                      backgroundColor: "#1a1a1a",
                    },
                  ]}
                >
                  <Text>{t("manage-keys")}</Text>
                  <Text style={[{ fontSize: 16 }]}>→</Text>
                </View>
              </AQLink>
              <WebhookManager />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const DebugRecording = () => {
  const dispatch = useAppDispatch();
  const isReady = useAppSelector(selectIsReady);
  const serverSettings = useAppSelector(selectServerSettings);
  const { url } = useStreamplaceNode();
  const { t } = useTranslation();
  const debugRecordingOn = serverSettings?.debugRecording === true;

  useEffect(() => {
    if (isReady) {
      dispatch(getServerSettingsFromPDS());
    }
  }, [isReady]);

  const u = new URL(url);
  return (
    <View
      style={[
        { alignItems: "center" },
        { justifyContent: "center" },
        { gap: 16 },
      ]}
    >
      <View
        style={[
          { alignItems: "center" },
          { justifyContent: "space-between" },
          { width: "100%", flexDirection: "row" },
        ]}
      >
        <View style={[{ flex: 1 }, { paddingRight: 12 }]}>
          <Text size="xl">{t("debug-recording-title", { host: u.host })}</Text>
          <Text size="lg" color="muted">
            {t("debug-recording-description")}
          </Text>
        </View>
        <Switch
          value={debugRecordingOn}
          onValueChange={(value) => {
            if (value === true) {
              dispatch(
                createServerSettingsRecord({
                  ...serverSettings,
                  debugRecording: true,
                }),
              );
            } else {
              dispatch(
                createServerSettingsRecord({
                  ...serverSettings,
                  debugRecording: false,
                }),
              );
            }
          }}
        />
      </View>
    </View>
  );
};
