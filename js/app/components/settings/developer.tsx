import {
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
import { Check, ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

export function DeveloperSettings() {
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");
  const { t, i18n } = useTranslation("settings");

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
    <View style={[zero.layout.flex.align.center, zero.px[8], zero.py[4]]}>
      <View
        style={[
          zero.gap.all[12],
          { paddingVertical: 24, maxWidth: 500, width: "100%" },
        ]}
      >
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
                                    i18n.language === code ? "bold" : "normal",
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
      </View>
    </View>
  );
}
