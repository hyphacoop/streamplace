// Clean i18n exports - only what's actually being used

// Main provider and types
export {
  DirectI18nProvider,
  clearTranslations,
  registerTranslation,
  registerTranslations,
  useDirectI18n,
} from "./direct-provider";

// Metro-compatible dynamic loading exports
export {
  clearCache,
  dynamicActivate,
  getAvailableLocales,
  getCacheStats,
  isLocaleAvailable,
  loadAllLocales,
  loadLocale,
  loadLocales,
  preloadLocales,
} from "./loaders/metro-loader";

export type {
  LanguageInfo as DirectLanguageInfo,
  SupportedLocale as DirectSupportedLocale,
  TranslationSource,
} from "./direct-provider";

export {
  DEFAULT_LOCALE as DIRECT_DEFAULT_LOCALE,
  LANGUAGE_INFO as DIRECT_LANGUAGE_INFO,
  SUPPORTED_LOCALES as DIRECT_SUPPORTED_LOCALES,
} from "./direct-provider";

// Language selector components
export {
  DirectLanguageIndicator,
  DirectLanguageSelector,
} from "./direct-language-selector";

// Re-export Fluent components for convenience
export { Localized, useLocalization, withLocalization } from "@fluent/react";

// Re-export Fluent core for advanced usage if needed
export { FluentBundle, FluentResource } from "@fluent/bundle";
