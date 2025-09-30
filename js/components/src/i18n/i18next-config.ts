// TypeScript i18next configuration with Fluent and manifest integration
// modified from https://github.com/inaturalist/iNaturalistReactNative/blob/main/src/i18n/initI18next.js

import i18next from "i18next";
import Fluent from "i18next-fluent";
import resourcesToBackend from "i18next-resources-to-backend";
import "intl-pluralrules";
import { initReactI18next } from "react-i18next";

// Import our manifest directly to avoid circular dependency
import manifest from "../../locales/manifest.json";

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

// Mock storage for now - replace with actual zustand storage
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {
      // localStorage not available (e.g. in some test environments)
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && localStorage) {
        localStorage.setItem(key, value);
      }
    } catch {
      // localStorage not available (e.g. in some test environments)
    }
  },
};

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

export function getCurrentLocale(): string {
  const stored = storage.getItem("@streamplace/locale");
  if (stored && manifest.supportedLocales.includes(stored)) {
    return stored;
  }
  return getLocaleFromSystemLocale();
}

// Enhanced fallback logic using manifest
function getFallbackChain(code: string): string[] {
  const fallbacks: string[] = [];

  console.log("Determining fallback lang to be", code);

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

const LOCALE = getCurrentLocale();

export const I18NEXT_CONFIG = {
  lng: LOCALE,
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
  fallbackLng: getFallbackChain,
  supportedLngs: [
    ...manifest.supportedLocales,
    // Include base language codes for i18next fallback matching
    "en",
    "pt",
    "es",
    "zh",
    "fr",
  ],
  debug: process.env.NODE_ENV === "development",
};

// Translation loading function that loads compiled JSON files
async function loadTranslationData(locale: string): Promise<any> {
  try {
    if (!manifest.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    let translations: any = {};

    try {
      // For web environments, load from public directory
      if (typeof window !== "undefined") {
        const response = await fetch(`/locales/${locale}/messages.json`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        translations = await response.json();
      } else {
        // For React Native, use static requires for bundler compatibility
        switch (locale) {
          case "en-US":
            translations = require("../../public/locales/en-US/messages.json");
            break;
          case "pt-BR":
            translations = require("../../public/locales/pt-BR/messages.json");
            break;
          case "es-ES":
            translations = require("../../public/locales/es-ES/messages.json");
            break;
          case "zh-Hant":
            translations = require("../../public/locales/zh-Hant/messages.json");
            break;
          case "fr-FR":
            translations = require("../../public/locales/fr-FR/messages.json");
            break;
          default:
            throw new Error(`No static translation file for locale: ${locale}`);
        }
      }
    } catch (loadError: any) {
      throw new Error(
        `Failed to load translations for ${locale}: ${loadError.message}`,
      );
    }

    if (!translations || Object.keys(translations).length === 0) {
      throw new Error("No translations found in file");
    }

    return translations;
  } catch (error: any) {
    console.error(`Failed to load translations for ${locale}:`, error);
    // Return minimal fallback
    return {
      loading: "Loading...",
      error: "Error",
      cancel: "Cancel",
      "settings-title": "Settings",
    };
  }
}

// Initialize i18next with our configuration
let initPromise: Promise<typeof i18next> | null = null;

export default function initI18next(config: any = {}): Promise<typeof i18next> {
  // Return existing promise if already initializing
  if (initPromise) {
    return initPromise;
  }

  const finalConfig = { ...I18NEXT_CONFIG, ...config };

  initPromise = i18next
    .use(initReactI18next)
    .use(Fluent)
    .use(
      resourcesToBackend((locale: string, namespace: string, callback: any) => {
        // Load translations using our manifest-based system
        loadTranslationData(locale)
          .then((translations) => callback(null, translations))
          .catch((error) => callback(error, null));
      }),
    )
    .init(finalConfig)
    .then(() => i18next);

  return initPromise;
}

// Utility functions for language management
export async function changeLanguage(locale: string): Promise<void> {
  storage.setItem("@streamplace/locale", locale);
  await i18next.changeLanguage(locale);
}

export function getCurrentLanguage(): string {
  return i18next.language || LOCALE;
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
