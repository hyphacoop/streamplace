// App-level i18n configuration using Streamplace components library
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Fluent from "i18next-fluent";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";
import manifest from "./manifest.json";

// Types
export type SupportedLocale = (typeof manifest.supportedLocales)[number];
export type LanguageInfo = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

// Get device locale and map to supported locale
function getDeviceLocale(): SupportedLocale {
  const deviceLocale = RNLocalize.getLocales()?.[0]?.languageTag || "en";
  const cleanLocale = deviceLocale.replace("_", "-").replace(/@.*/, "");

  // Check exact match first
  if (manifest.supportedLocales.includes(cleanLocale as SupportedLocale)) {
    return cleanLocale as SupportedLocale;
  }

  // Check language part (e.g., "en" from "en-GB")
  const lang = cleanLocale.split("-")[0];
  const matchingLocale = manifest.supportedLocales.find((locale) =>
    locale.startsWith(lang + "-"),
  );

  return (matchingLocale || manifest.fallbackChain[0]) as SupportedLocale;
}

// Initialize i18next
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(Backend)
  .use(Fluent)
  .init({
    // Language settings
    lng: getDeviceLocale(),
    // Language code mapping strategy:
    // Browsers/devices often detect base language codes (e.g., "zh", "pt", "es")
    // but our app only supports specific regional variants (e.g., "zh-TW", "pt-BR").
    // This fallback mapping prevents "language code not found" warnings by
    // automatically routing base codes to their appropriate regional variants.
    fallbackLng: {
      // Map base language codes to specific variants
      zh: ["zh-TW"],
      pt: ["pt-BR"],
      es: ["es-ES"],
      en: ["en-US"],
      fr: ["fr-FR"],
      // Default fallback for any other language
      default: manifest.fallbackChain,
    },
    supportedLngs: manifest.supportedLocales,

    // Language code normalization options:
    // - cleanCode: normalizes language codes (removes script/region if not needed)
    // - nonExplicitSupportedLngs: prevents warnings when fallback mapping handles
    //   base language codes that aren't explicitly in supportedLngs
    cleanCode: true,
    nonExplicitSupportedLngs: true,

    // Backend configuration
    backend: {
      loadPath: "/locales/{{lng}}/messages.json",
      crossDomain: true,
    },

    // Language detection
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "@streamplace/locale",
      caches: ["localStorage"],
    },

    // Fluent plugin settings
    i18nFormat: {
      fluentBundleOptions: {
        useIsolating: false,
        functions: {
          VOWORCON: ([txt]: [string]) =>
            "aeiou".indexOf(txt[0]?.toLowerCase() || "") >= 0 ? "vow" : "con",
          JOIN: (args: string[], opts: { separator?: string } = {}) =>
            args.filter(Boolean).join(opts.separator || ""),
        },
      },
    },

    // Development settings
    debug: process.env.NODE_ENV === "development",

    // React settings
    react: {
      useSuspense: false,
    },

    // Disable interpolation since Fluent handles it
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
export { manifest };
