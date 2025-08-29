// Metro-compatible translation loader using static imports
import type { TranslationSource } from "../direct-provider";
import type { SupportedLocale } from "../locales";
import {
  localeMessages,
  supportedLocales,
  validateLocaleModule,
} from "../locales";

// Use statically imported locale messages from mapping
// Metro can analyze these at build time

// Cache to avoid re-loading the same translations
const translationCache = new Map<SupportedLocale, string>();
const loadingPromises = new Map<SupportedLocale, Promise<string>>();

/**
 * Load a translation module using Metro-compatible static imports
 */
function loadTranslationModule(locale: SupportedLocale): string {
  const module = localeMessages[locale];

  if (!validateLocaleModule(locale, module)) {
    throw new Error(`Invalid or missing translation module for ${locale}`);
  }

  return module.messages;
}

/**
 * Load translations for a specific locale (Metro-compatible)
 * Returns cached version if already loaded
 */
export async function loadLocale(
  locale: SupportedLocale,
  debug = false,
): Promise<string> {
  if (debug) {
    console.log(`[metro-loader] Loading locale: ${locale}`);
  }

  // Return cached version if available
  if (translationCache.has(locale)) {
    if (debug) {
      console.log(`[metro-loader] Using cached translations for ${locale}`);
    }
    return translationCache.get(locale)!;
  }

  // Return existing promise if already loading
  if (loadingPromises.has(locale)) {
    if (debug) {
      console.log(`[metro-loader] Waiting for in-progress load of ${locale}`);
    }
    return loadingPromises.get(locale)!;
  }

  // Start loading (wrap synchronous loading in Promise for consistent API)
  const loadingPromise = new Promise<string>((resolve, reject) => {
    try {
      const messages = loadTranslationModule(locale);

      // Cache the result
      translationCache.set(locale, messages);

      if (debug) {
        console.log(
          `[metro-loader] Successfully loaded ${locale} (${messages.length} chars)`,
        );
      }

      resolve(messages);
    } catch (error) {
      reject(error);
    }
  });

  loadingPromises.set(locale, loadingPromise);

  try {
    const result = await loadingPromise;
    return result;
  } catch (error) {
    // Clean up failed loading promise
    loadingPromises.delete(locale);
    throw error;
  } finally {
    // Clean up completed loading promise
    loadingPromises.delete(locale);
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
    console.log(`[metro-loader] Loading multiple locales:`, locales);
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
      console.error(`[metro-loader] Failed to load ${locale}:`, result.reason);
    }
  });

  if (errors.length > 0 && debug) {
    console.warn(
      `[metro-loader] Failed to load ${errors.length}/${locales.length} locales`,
    );
  }

  return translations;
}

/**
 * Load all supported locales
 */
export async function loadAllLocales(
  debug = false,
): Promise<TranslationSource[]> {
  return loadLocales([...supportedLocales], debug);
}

/**
 * Activate a locale by loading it and updating the i18n system
 * Metro-compatible version of dynamicActivate
 */
export async function dynamicActivate(
  locale: SupportedLocale,
  onLoad?: (translationSource: TranslationSource) => void,
  debug = false,
): Promise<void> {
  if (debug) {
    console.log(`[metro-loader] Activating locale: ${locale}`);
  }

  try {
    const content = await loadLocale(locale, debug);
    const translationSource: TranslationSource = { locale, content };

    if (onLoad) {
      onLoad(translationSource);
    }

    if (debug) {
      console.log(`[metro-loader] Successfully activated ${locale}`);
    }
  } catch (error) {
    console.error(`[metro-loader] Failed to activate ${locale}:`, error);
    throw error;
  }
}

/**
 * Preload translations for faster switching
 * Useful for loading non-active locales in the background
 */
export async function preloadLocales(
  locales: SupportedLocale[],
  debug = false,
): Promise<void> {
  if (debug) {
    console.log(`[metro-loader] Preloading locales:`, locales);
  }

  // Load in background without waiting
  loadLocales(locales, debug).catch((error) => {
    if (debug) {
      console.warn(`[metro-loader] Preloading failed:`, error);
    }
  });
}

/**
 * Clear the translation cache
 * Useful for development or when forcing a reload
 */
export function clearCache(debug = false): void {
  if (debug) {
    console.log(`[metro-loader] Clearing translation cache`);
  }

  translationCache.clear();
  loadingPromises.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): {
  cached: SupportedLocale[];
  loading: SupportedLocale[];
  totalCached: number;
} {
  return {
    cached: Array.from(translationCache.keys()),
    loading: Array.from(loadingPromises.keys()),
    totalCached: translationCache.size,
  };
}

/**
 * Check if a locale is available for loading
 */
export function isLocaleAvailable(locale: SupportedLocale): boolean {
  const module = localeMessages[locale];
  return validateLocaleModule(locale, module);
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): SupportedLocale[] {
  return (Object.keys(localeMessages) as SupportedLocale[]).filter((locale) =>
    isLocaleAvailable(locale),
  );
}
