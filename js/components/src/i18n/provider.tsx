// Simple i18n provider wrapper for consistent setup
import type { i18n } from "i18next";
import { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

interface I18nProviderProps {
  children: ReactNode;
  i18n: i18n;
}

/**
 * Simple wrapper around I18nextProvider for consistent setup
 * The actual i18n instance should be configured at the app level
 */
export function I18nProvider({ children, i18n }: I18nProviderProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
