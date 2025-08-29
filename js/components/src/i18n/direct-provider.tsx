// Ultra-simple direct translation provider - no loading complexity
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { negotiateLanguages } from "@fluent/langneg";
import { LocalizationProvider, ReactLocalization } from "@fluent/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadAllLocales, loadLocale } from "./loaders/dynamic-loader";
import type { SupportedLocale } from "./locales";
import { supportedLocales } from "./locales";
import manifest from "./manifest.json";

export type { SupportedLocale };
export const SUPPORTED_LOCALES = supportedLocales;
export const DEFAULT_LOCALE: SupportedLocale = manifest
  .fallbackChain[0] as SupportedLocale;

export interface LanguageInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  fallback?: string;
}

// Extract language info from manifest for supported locales
export const LANGUAGE_INFO: Record<SupportedLocale, LanguageInfo> =
  Object.fromEntries(
    supportedLocales.map((locale) => [
      locale,
      {
        code: locale,
        name: manifest.languages[locale]?.name || locale,
        nativeName: manifest.languages[locale]?.nativeName || locale,
        flag: manifest.languages[locale]?.flag || "🌐",
      },
    ]),
  ) as Record<SupportedLocale, LanguageInfo>;

// Simple fallback for critical errors
const MINIMAL_FALLBACK: string = `
loading = Loading...
error = Error
cancel = Cancel
settings-title = Settings
`;

// Global translation registry for external sources
const translationRegistry = new Map<SupportedLocale, string>();

// Translation source configuration
export interface TranslationSource {
  locale: SupportedLocale;
  content: string;
}

interface DirectI18nContextValue {
  locale: SupportedLocale;
  changeLocale: (locale: SupportedLocale) => void;
  isLoading: boolean;
}

const DirectI18nContext = createContext<DirectI18nContextValue | null>(null);

function getUserLocale(): SupportedLocale {
  try {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("@streamplace/locale")
        : null;

    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }

    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;

    // Enhanced locale detection
    if (systemLocale.startsWith("pt")) return "pt-BR";
    if (systemLocale.startsWith("es")) return "es-ES";
    if (systemLocale.startsWith("zh-TW") || systemLocale === "zh-Hant-TW")
      return "zh-TW";
    if (systemLocale.startsWith("en")) return "en-US";

    const negotiated = negotiateLanguages([systemLocale], SUPPORTED_LOCALES, {
      defaultLocale: DEFAULT_LOCALE,
    });

    return (negotiated[0] as SupportedLocale) || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function createBundles(locale: SupportedLocale): ReactLocalization {
  console.log(`[direct-i18n] Creating bundles for ${locale}`);

  const locales =
    locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE];

  function* generateBundles() {
    for (const localeCode of locales) {
      console.log(`[direct-i18n] Creating bundle for ${localeCode}`);

      const bundle = new FluentBundle(localeCode, {
        useIsolating: false,
      });

      // Try external translations first, then fall back to minimal fallback
      const translationContent =
        translationRegistry.get(localeCode as SupportedLocale) ||
        MINIMAL_FALLBACK;

      if (translationContent) {
        try {
          const resource = new FluentResource(translationContent);
          const errors = bundle.addResource(resource);

          if (errors.length > 0) {
            console.warn(
              `[direct-i18n] Bundle errors for ${localeCode}:`,
              errors,
            );
          }

          console.log(
            `[direct-i18n] Added resource to ${localeCode} bundle (${translationContent.length} chars)`,
          );
        } catch (error) {
          console.error(
            `[direct-i18n] Failed to add resource for ${localeCode}:`,
            error,
          );
        }
      }

      yield bundle;
    }
  }

  const l10n = new ReactLocalization(generateBundles());
  console.log(`[direct-i18n] Created ReactLocalization for ${locale}`);

  return l10n;
}

interface DirectI18nProviderProps {
  children: React.ReactNode;
  /** External translation sources */
  translations?: TranslationSource[];
  /** Enable debug logging */
  debug?: boolean;
  /** Enable dynamic loading from compiled .ftl files */
  enableDynamicLoading?: boolean;
  /** Preload all locales on mount (only with dynamic loading) */
  preloadAll?: boolean;
}

export function DirectI18nProvider({
  children,
  translations,
  debug = false,
  enableDynamicLoading = false,
  preloadAll = false,
}: DirectI18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(getUserLocale());
  const [isLoading, setIsLoading] = useState(enableDynamicLoading);
  const [dynamicTranslations, setDynamicTranslations] = useState<
    TranslationSource[]
  >([]);

  // Initialize dynamic or static translations on mount
  useEffect(() => {
    const initializeTranslations = async () => {
      if (enableDynamicLoading) {
        if (debug) {
          console.log(
            `[direct-i18n] Initializing dynamic loading for ${locale}`,
          );
        }

        try {
          if (preloadAll) {
            // Load all locales
            const allTranslations = await loadAllLocales(debug);
            setDynamicTranslations(allTranslations);

            allTranslations.forEach(({ locale, content }) => {
              translationRegistry.set(locale, content);
              if (debug) {
                console.log(
                  `[direct-i18n] Registered ${locale} (${content.length} chars)`,
                );
              }
            });
          } else {
            // Load only current locale
            const content = await loadLocale(locale, debug);
            const translationSource = { locale, content };
            setDynamicTranslations([translationSource]);
            translationRegistry.set(locale, content);

            if (debug) {
              console.log(
                `[direct-i18n] Registered ${locale} (${content.length} chars)`,
              );
            }
          }
        } catch (error) {
          console.error(
            `[direct-i18n] Failed to load dynamic translations:`,
            error,
          );
          // Fall back to defaults
        } finally {
          setIsLoading(false);
        }
      } else if (translations) {
        // Static translations
        if (debug) {
          console.log(
            `[direct-i18n] Registering ${translations.length} external translations`,
          );
        }

        translations.forEach(({ locale, content }) => {
          translationRegistry.set(locale, content);
          if (debug) {
            console.log(
              `[direct-i18n] Registered ${locale} (${content.length} chars)`,
            );
          }
        });
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    initializeTranslations();
  }, [translations, debug, enableDynamicLoading, preloadAll]);

  if (debug) {
    console.log(`[direct-i18n] Provider initialized with locale: ${locale}`);
  }

  const l10n = useMemo(() => {
    if (debug) {
      console.log(`[direct-i18n] Creating localization for ${locale}`);
    }
    return createBundles(locale);
  }, [locale]);

  const changeLocale = useCallback(
    async (newLocale: SupportedLocale) => {
      if (newLocale === locale) return;

      if (debug) {
        console.log(
          `[direct-i18n] Changing locale from ${locale} to ${newLocale}`,
        );
      }

      // Check if we need to load translations (only show loading if we do)
      const needsLoading =
        enableDynamicLoading && !translationRegistry.has(newLocale);

      if (needsLoading) {
        setIsLoading(true);
      }

      try {
        if (needsLoading) {
          // Load the new locale dynamically
          if (debug) {
            console.log(`[direct-i18n] Loading ${newLocale} dynamically`);
          }

          const content = await loadLocale(newLocale, debug);
          translationRegistry.set(newLocale, content);

          // Update dynamic translations state
          setDynamicTranslations((prev) => {
            const existing = prev.find((t) => t.locale === newLocale);
            if (existing) {
              return prev.map((t) =>
                t.locale === newLocale ? { locale: newLocale, content } : t,
              );
            } else {
              return [...prev, { locale: newLocale, content }];
            }
          });
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("@streamplace/locale", newLocale);
        }
        setLocale(newLocale);
      } catch (error) {
        console.error("[direct-i18n] Failed to change locale:", error);
      } finally {
        if (needsLoading) {
          setIsLoading(false);
        }
      }
    },
    [locale, debug, enableDynamicLoading],
  );

  const contextValue: DirectI18nContextValue = {
    locale,
    changeLocale,
    isLoading,
  };

  return (
    <DirectI18nContext.Provider value={contextValue}>
      <LocalizationProvider l10n={l10n}>{children}</LocalizationProvider>
    </DirectI18nContext.Provider>
  );
}

export function useDirectI18n(): DirectI18nContextValue {
  const context = useContext(DirectI18nContext);
  if (!context) {
    throw new Error("useDirectI18n must be used within DirectI18nProvider");
  }
  return context;
}

// Utility functions for external translation management
export function registerTranslation(
  locale: SupportedLocale,
  content: string,
): void {
  translationRegistry.set(locale, content);
  console.log(
    `[direct-i18n] Registered translation for ${locale} (${content.length} chars)`,
  );
}

export function registerTranslations(translations: TranslationSource[]): void {
  translations.forEach(({ locale, content }) => {
    registerTranslation(locale, content);
  });
}

export function clearTranslations(): void {
  translationRegistry.clear();
  console.log("[direct-i18n] Cleared all registered translations");
}

// Manifest utilities
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return manifest.supportedLocales.includes(locale as SupportedLocale);
}

export function getLanguageInfo(locale: SupportedLocale): LanguageInfo | null {
  return LANGUAGE_INFO[locale] || null;
}

export function getFallbackChain(): SupportedLocale[] {
  return manifest.fallbackChain as SupportedLocale[];
}

export function getDefaultLocale(): SupportedLocale {
  return DEFAULT_LOCALE;
}

export function getAllSupportedLocales(): SupportedLocale[] {
  return [...manifest.supportedLocales] as SupportedLocale[];
}

// Validation utilities
export function validateManifest(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!manifest.supportedLocales || !Array.isArray(manifest.supportedLocales)) {
    errors.push("Missing or invalid supportedLocales array");
  }

  if (!manifest.fallbackChain || !Array.isArray(manifest.fallbackChain)) {
    errors.push("Missing or invalid fallbackChain array");
  }

  if (!manifest.languages || typeof manifest.languages !== "object") {
    errors.push("Missing or invalid languages object");
  }

  // Check that all supported locales have language info
  if (manifest.supportedLocales && manifest.languages) {
    for (const locale of manifest.supportedLocales) {
      if (!manifest.languages[locale]) {
        errors.push(`Missing language info for supported locale: ${locale}`);
      }
    }
  }

  // Check that fallback chain contains valid locales
  if (manifest.fallbackChain && manifest.supportedLocales) {
    for (const locale of manifest.fallbackChain) {
      if (!manifest.supportedLocales.includes(locale)) {
        errors.push(`Fallback locale ${locale} is not in supportedLocales`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Re-export Fluent components for convenience
export { Localized, useLocalization, withLocalization } from "@fluent/react";
