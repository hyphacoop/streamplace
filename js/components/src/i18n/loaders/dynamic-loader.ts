// Manifest-based loader using pre-compiled translation modules
import type { TranslationSource } from "../direct-provider";
import {
  type SupportedLocale,
  getAvailableLocales,
  localeMessages,
  supportedLocales,
  validateLocaleModule,
} from "../locales/index";

// Cache to avoid re-processing the same translations
const translationCache = new Map<SupportedLocale, string>();

/**
 * Get translation content from the manifest
 * This is synchronous since all translations are statically imported
 */
function getTranslationFromManifest(locale: SupportedLocale): string {
  const module = localeMessages[locale];

  if (!validateLocaleModule(locale, module)) {
    throw new Error(`Invalid or missing translation module for ${locale}`);
  }

  return module.messages;
}

/**
 * Load translations for a specific locale
 * Returns cached version if already processed
 */
export async function loadLocale(
  locale: SupportedLocale,
  debug = false,
): Promise<string> {
  if (debug) {
    console.log(`[manifest-loader] Loading locale: ${locale}`);
  }

  // Return cached version if available
  if (translationCache.has(locale)) {
    if (debug) {
      console.log(`[manifest-loader] Using cached translations for ${locale}`);
    }
    return translationCache.get(locale)!;
  }

  try {
    // Get translations from the manifest (synchronous)
    const messages = getTranslationFromManifest(locale);

    // Cache the result
    translationCache.set(locale, messages);

    if (debug) {
      console.log(
        `[manifest-loader] Successfully loaded ${locale} (${messages.length} chars)`,
      );
    }

    return messages;
  } catch (error) {
    console.error(`[manifest-loader] Failed to load ${locale}:`, error);
    throw error;
  }
}

/**
 * Load multiple locales at once
 */
export async function loadLocales(
  locales: SupportedLocale[],
  debug = false,
): Promise<TranslationSource[]> {
  if (debug) {
    console.log(`[manifest-loader] Loading multiple locales:`, locales);
  }

  const results = await Promise.allSettled(
    locales.map(async (locale) => ({
      locale,
      content: await loadLocale(locale, debug),
    })),
  );

  const translations: TranslationSource[] = [];
  const errors: { locale: SupportedLocale; error: any }[] = [];

  results.forEach((result, index) => {
    const locale = locales[index];

    if (result.status === "fulfilled") {
      translations.push(result.value);
    } else {
      errors.push({ locale, error: result.reason });
      console.error(
        `[manifest-loader] Failed to load ${locale}:`,
        result.reason,
      );
    }
  });

  if (errors.length > 0 && debug) {
    console.warn(
      `[manifest-loader] Failed to load ${errors.length}/${locales.length} locales`,
    );
  }

  return translations;
}

/**
 * Load all supported locales
 * Uses getAvailableLocales to only load successfully imported locales
 */
export async function loadAllLocales(
  debug = false,
): Promise<TranslationSource[]> {
  const availableLocales = getAvailableLocales();
  if (debug) {
    console.log(
      `[manifest-loader] Available locales from manifest:`,
      availableLocales,
    );
  }
  return loadLocales(availableLocales, debug);
}

/**
 * Activate a locale by loading it and updating the i18n system
 * Similar to Lingui's dynamicActivate pattern
 */
export async function dynamicActivate(
  locale: SupportedLocale,
  onLoad?: (translationSource: TranslationSource) => void,
  debug = false,
): Promise<void> {
  if (debug) {
    console.log(`[manifest-loader] Activating locale: ${locale}`);
  }

  try {
    const content = await loadLocale(locale, debug);
    const translationSource: TranslationSource = { locale, content };

    if (onLoad) {
      onLoad(translationSource);
    }

    if (debug) {
      console.log(`[manifest-loader] Successfully activated ${locale}`);
    }
  } catch (error) {
    console.error(`[manifest-loader] Failed to activate ${locale}:`, error);
    throw error;
  }
}

/**
 * Preload translations for faster switching
 * Since all translations are already statically imported, this just processes them
 */
export async function preloadLocales(
  locales: SupportedLocale[],
  debug = false,
): Promise<void> {
  if (debug) {
    console.log(`[manifest-loader] Preloading locales:`, locales);
  }

  // Process in background without waiting
  loadLocales(locales, debug).catch((error) => {
    if (debug) {
      console.warn(`[manifest-loader] Preloading failed:`, error);
    }
  });
}

/**
 * Clear the translation cache
 * Useful for development or when forcing a reload
 */
export function clearCache(debug = false): void {
  if (debug) {
    console.log(`[manifest-loader] Clearing translation cache`);
  }

  translationCache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): {
  cached: SupportedLocale[];
  loading: SupportedLocale[];
  totalCached: number;
  manifestLocales: readonly SupportedLocale[];
  availableLocales: SupportedLocale[];
} {
  return {
    cached: Array.from(translationCache.keys()),
    loading: [], // No loading promises needed since everything is synchronous
    totalCached: translationCache.size,
    manifestLocales: supportedLocales,
    availableLocales: getAvailableLocales(),
  };
}

/**
 * Check if a locale is available in the manifest
 */
export function isLocaleAvailable(locale: SupportedLocale): boolean {
  try {
    const module = localeMessages[locale];
    return validateLocaleModule(locale, module);
  } catch {
    return false;
  }
}

/**
 * Get all supported locales from the manifest
 */
export function getSupportedLocales(): readonly SupportedLocale[] {
  return supportedLocales;
}
