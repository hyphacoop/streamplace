// App-level i18n configuration using Streamplace components library
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Fluent from "i18next-fluent";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
//import * as RNLocalize from "react-native-localize";
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
  //const deviceLocale = RNLocalize.getLocales()?.[0]?.languageTag || "en";
  //const cleanLocale = deviceLocale.replace("_", "-").replace(/@.*/, "");

  // until we can get a native release out, use browser locale or default to en
  const cleanLocale = (navigator?.language || "en")
    .replace("_", "-")
    .replace(/@.*/, "");

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
    fallbackLng: {
      // Default fallback
      default: manifest.fallbackChain,
    },
    supportedLngs: [
      ...manifest.supportedLocales,
      // Add base language codes to prevent warnings
      "zh",
      "pt",
      "es",
      "en",
      "fr",
    ],

    // Backend configuration
    backend: {
      loadPath: "/locales/{{lng}}/messages.json",
      crossDomain: true,
      request: (options: any, url: string, payload: any, callback: any) => {
        // Map base language codes to specific variants for file loading
        const languageMap: Record<string, string> = {
          zh: "zh-TW",
          pt: "pt-BR",
          es: "es-ES",
          en: "en-US",
          fr: "fr-FR",
        };

        // Extract language from URL and map it
        const urlMatch = url.match(/\/locales\/([^\/]+)\//);
        if (urlMatch) {
          const lng = urlMatch[1];
          const mappedLng = languageMap[lng] || lng;
          url = url.replace(`/locales/${lng}/`, `/locales/${mappedLng}/`);
        }

        // Use standard fetch
        fetch(url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then((data) => callback(null, { status: 200, data }))
          .catch((error) => callback(error, { status: 500, data: null }));
      },
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
