import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  LANGUAGE_INFO as DIRECT_LANGUAGE_INFO,
  SupportedLocale as DirectSupportedLocale,
  Localized,
  useDirectI18n,
} from "./direct-provider";

interface DirectLanguageSelectorProps {
  /** Display variant */
  variant?: "compact" | "expanded";
  /** Custom styling */
  style?: any;
  /** Show loading indicator */
  showLoading?: boolean;
}

/**
 * Simple language selector for DirectI18nProvider
 */
export function DirectLanguageSelector({
  variant = "expanded",
  showLoading = true,
  style,
}: DirectLanguageSelectorProps) {
  const { locale, changeLocale, isLoading } = useDirectI18n();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLanguage = DIRECT_LANGUAGE_INFO[locale];
  const availableLanguages = Object.values(DIRECT_LANGUAGE_INFO);

  const handleLanguageChange = (newLocale: DirectSupportedLocale) => {
    if (newLocale !== locale && !isLoading) {
      changeLocale(newLocale);
      setShowDropdown(false);
    }
  };

  if (variant === "expanded") {
    return (
      <View style={[style]}>
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 4,
              color: "white",
            }}
          >
            <Localized id="language-selection">Language</Localized>
          </Text>
          <Text style={{ fontSize: 14, opacity: 0.7, color: "white" }}>
            <Localized id="language-selection-description">
              Choose your preferred language
            </Localized>
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {availableLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => handleLanguageChange(language.code)}
              disabled={isLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: locale === language.code ? "#3b82f6" : "#d1d5db",
                backgroundColor:
                  locale === language.code ? "#eff6ff" : "#ffffff",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Text style={{ fontSize: 20 }}>{language.flag}</Text>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "500" }}>
                    {language.nativeName}
                  </Text>
                  <Text style={{ fontSize: 14, opacity: 0.6 }}>
                    {language.name}
                  </Text>
                </View>
              </View>

              {locale === language.code && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#3b82f6",
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {showLoading && isLoading && (
          <View style={{ marginTop: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 12, opacity: 0.6 }}>Loading...</Text>
          </View>
        )}
      </View>
    );
  }

  // Compact variant
  return (
    <View style={[{ position: "relative" }, style]}>
      <TouchableOpacity
        onPress={() => !isLoading && setShowDropdown(!showDropdown)}
        disabled={isLoading}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#d1d5db",
          backgroundColor: "#ffffff",
          minWidth: 120,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 16 }}>{currentLanguage.flag}</Text>
          <Text style={{ fontSize: 14, fontWeight: "500" }}>
            {currentLanguage.nativeName}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 12,
            opacity: 0.6,
            transform: [{ rotate: showDropdown ? "180deg" : "0deg" }],
          }}
        >
          ▼
        </Text>
      </TouchableOpacity>

      {showDropdown && (
        <View
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: "#ffffff",
            borderRadius: 6,
            borderWidth: 1,
            borderColor: "#d1d5db",
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            zIndex: 1000,
            maxHeight: 200,
          }}
        >
          <ScrollView style={{ maxHeight: 180 }}>
            {availableLanguages
              .filter((language) => language.code !== locale)
              .map((language, index, array) => (
                <TouchableOpacity
                  key={language.code}
                  onPress={() => handleLanguageChange(language.code)}
                  disabled={isLoading}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: index < array.length - 1 ? 1 : 0,
                    borderBottomColor: "#f3f4f6",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{language.flag}</Text>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "500" }}>
                      {language.nativeName}
                    </Text>
                    <Text style={{ fontSize: 12, opacity: 0.6 }}>
                      {language.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

      {showLoading && isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: -30,
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Text style={{ fontSize: 10, opacity: 0.6 }}>...</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Simple language indicator that shows current locale
 */
export function DirectLanguageIndicator({ style }: { style?: any }) {
  const { locale } = useDirectI18n();
  const currentLanguage = DIRECT_LANGUAGE_INFO[locale];

  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 6 }, style]}
    >
      <Text style={{ fontSize: 14 }}>{currentLanguage.flag}</Text>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        {currentLanguage.nativeName}
      </Text>
    </View>
  );
}
