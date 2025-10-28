// TypeScript i18next configuration with Fluent and manifest integration
// modified from https://github.com/inaturalist/iNaturalistReactNative/blob/main/src/i18n/initI18next.js

import i18next from "i18next";
import Fluent from "i18next-fluent";
import resourcesToBackend from "i18next-resources-to-backend";
import "intl-pluralrules";
import { initReactI18next } from "react-i18next";

// Import our manifest directly to avoid circular dependency
import manifest from "../../locales/manifest.json";
import storage from "../storage";

const LOCALE_STORAGE_KEY = "@streamplace/locale";

// Try to import expo-localization, but make it optional
let Localization: typeof import("expo-localization") | null = null;
try {
  const localizationModule = require("expo-localization");
  // Handle both default and named exports
  Localization = localizationModule.default
    ? localizationModule.default
    : localizationModule;
} catch {
  // expo-localization not available, will use browser/fallback detection
}

function cleanLocaleName(locale: string): string {
  return locale.replace("_", "-").replace(/@.*/, "");
}

export function getLocaleFromSystemLocale(): string {
  let systemLocale = "en";

  // Try to get locale from expo-localization if available
  if (Localization && typeof Localization.getLocales === "function") {
    try {
      const locales = Localization.getLocales();
      systemLocale = locales?.[0]?.languageTag || "en";
    } catch (error) {
      console.warn("Failed to get locales from expo-localization:", error);
    }
  } else if (typeof navigator !== "undefined" && navigator.language) {
    // Fallback to browser navigator.language
    systemLocale = navigator.language;
  }

  const candidateLocale = cleanLocaleName(systemLocale);

  // Check if the full locale is supported (e.g., "en-US")
  if (manifest.supportedLocales.includes(candidateLocale)) {
    return candidateLocale;
  }

  // Check if the language part is supported (e.g., "en" from "en-GB")
  const lang = candidateLocale.split("-")[0];
  const matchingLocale = manifest.supportedLocales.find((locale) =>
    locale.startsWith(lang + "-"),
  );

  if (matchingLocale) {
    return matchingLocale;
  }

  // Fall back to default locale from manifest
  return manifest.fallbackChain[0];
}

// Cache for the current locale to avoid async lookups
let cachedLocale: string | null = null;

export async function getCurrentLocale(): Promise<string> {
  if (cachedLocale) {
    return cachedLocale;
  }

  const stored = await storage.getItem(LOCALE_STORAGE_KEY);
  if (stored && manifest.supportedLocales.includes(stored)) {
    cachedLocale = stored;
    return stored;
  }

  const systemLocale = getLocaleFromSystemLocale();
  cachedLocale = systemLocale;
  return systemLocale;
}

// Synchronous version for initial load - returns cached or system locale
export function getCurrentLocaleSync(): string {
  return cachedLocale || getLocaleFromSystemLocale();
}

// Enhanced fallback logic using manifest
function getFallbackChain(code: string): string[] {
  const fallbacks: string[] = [];

  if (!code) return manifest.fallbackChain;

  // Regional fallbacks
  if (code.match(/^es-/)) {
    fallbacks.push("es-ES"); // Spanish fallback
  } else if (code.match(/^fr-/)) {
    fallbacks.push("fr-FR"); // French fallback
  } else if (code.match(/^pt-/)) {
    fallbacks.push("pt-BR"); // Portuguese fallback
  } else if (code.match(/^zh-/)) {
    fallbacks.push("zh-Hant"); // Chinese fallback
  }

  // Add manifest fallback chain
  return [...fallbacks, ...manifest.fallbackChain];
}

// Use sync version for initial config - will be updated when storage loads
const LOCALE = getCurrentLocaleSync();

export const I18NEXT_CONFIG = {
  lng: LOCALE,
  ns: ["common", "settings"], // Common should be first as it's most frequently used
  defaultNS: "common",
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
  react: {
    useSuspense: false, // Prevent Android crashes
  },
  i18nFormat: {
    fluentBundleOptions: {
      useIsolating: false,
      functions: {
        VOWORCON: ([txt]: [string]) =>
          "aeiou".indexOf(txt[0].toLowerCase()) >= 0 ? "vow" : "con",
        JOIN: (args: string[], opts: { separator?: string } = {}) =>
          args
            .filter(Boolean)
            .filter((s) => typeof s === "string")
            .join(opts.separator || ""),
      },
    },
  },
  load: "currentOnly",
  cleanCode: true,
  fallbackLng: getFallbackChain,
  supportedLngs: [...manifest.supportedLocales],
  debug: process.env.NODE_ENV === "development",
};

// Translation loading function that loads compiled JSON files per namespace
async function loadTranslationData(
  locale: string,
  namespace: string,
): Promise<any> {
  try {
    let translations: any = {};

    try {
      // For web environments, load from public directory
      if (typeof window !== "undefined") {
        const response = await fetch(`/locales/${locale}/${namespace}.json`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        translations = await response.json();
      } else {
        // For React Native, use static requires for bundler compatibility
        // Map base language codes to full locales
        const fullLocale = locale.includes("-")
          ? locale
          : {
              en: "en-US",
              pt: "pt-BR",
              es: "es-ES",
              zh: "zh-Hant",
              fr: "fr-FR",
            }[locale] || locale;

        // Static requires for React Native bundler
        const localeNamespaceKey = `${fullLocale}/${namespace}`;
        const translationMap: Record<string, any> = {
          "en-US/common": require("../../public/locales/en-US/common.json"),
          "pt-BR/common": require("../../public/locales/pt-BR/common.json"),
          "es-ES/common": require("../../public/locales/es-ES/common.json"),
          "zh-Hant/common": require("../../public/locales/zh-Hant/common.json"),
          "fr-FR/common": require("../../public/locales/fr-FR/common.json"),
          "en-US/settings": require("../../public/locales/en-US/settings.json"),
          "pt-BR/settings": require("../../public/locales/pt-BR/settings.json"),
          "es-ES/settings": require("../../public/locales/es-ES/settings.json"),
          "zh-Hant/settings": require("../../public/locales/zh-Hant/settings.json"),
          "fr-FR/settings": require("../../public/locales/fr-FR/settings.json"),
        };

        translations = translationMap[localeNamespaceKey];

        if (!translations) {
          throw new Error(
            `No static translation mapping for ${localeNamespaceKey}`,
          );
        }
      }
    } catch (loadError: any) {
      throw new Error(
        `Failed to load ${namespace} translations for ${locale}: ${loadError.message}`,
      );
    }

    if (!translations || Object.keys(translations).length === 0) {
      throw new Error("No translations found in file");
    }

    return translations;
  } catch (error: any) {
    console.error(
      `Failed to load ${namespace} translations for ${locale}:`,
      error,
    );
    // Return minimal fallback
    return {
      loading: "Loading...",
      error: "Error",
      cancel: "Cancel",
    };
  }
}

// Initialize i18next with our configuration
let initPromise: Promise<typeof i18next> | null = null;

export default async function initI18next(
  config: any = {},
): Promise<typeof i18next> {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  // Load stored locale from storage first
  const storedLocale = await getCurrentLocale();

  const finalConfig = {
    ...I18NEXT_CONFIG,
    lng: storedLocale,
    ...config,
  };

  initPromise = i18next
    .use(initReactI18next)
    .use(Fluent)
    .use(
      resourcesToBackend((locale: string, namespace: string, callback: any) => {
        // Load translations using our manifest-based namespace system
        loadTranslationData(locale, namespace)
          .then((translations) => callback(null, translations))
          .catch((error) => callback(error, null));
      }),
    )
    .init(finalConfig)
    .then(() => {
      // Automatically persist language changes to storage
      i18next.on("languageChanged", (lng) => {
        if (lng && manifest.supportedLocales.includes(lng)) {
          cachedLocale = lng;
          storage.setItem(LOCALE_STORAGE_KEY, lng);
        }
      });
      return i18next;
    });

  return initPromise;
}

// Utility functions for language management
export async function changeLanguage(locale: string): Promise<void> {
  // Storage is handled automatically via languageChanged event
  await i18next.changeLanguage(locale);
}

export function getCurrentLanguage(): string {
  // Return the cached locale preference, not i18next's resolved language
  // i18next.language may return just "zh" instead of "zh-Hant"
  return getCurrentLocaleSync();
}

export function getSupportedLocales(): string[] {
  return [...manifest.supportedLocales];
}

export function getLanguageInfo(locale: string): any {
  return manifest.languages[locale] || null;
}

export function isLocaleSupported(locale: string): boolean {
  return manifest.supportedLocales.includes(locale);
}

// Auto-initialize i18next on module load
// This ensures the instance is ready when used in providers
initI18next().catch((error) => {
  console.error("Failed to auto-initialize i18n:", error);
});

export { i18next };
