// Simple i18n provider wrapper for consistent setup
import type { i18n } from "i18next";
import React, { ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

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

/**
 * Basic language selector component
 */
export function LanguageSelector({
  languages,
  showFlags = true,
  className,
  onChange,
}: {
  languages: Array<{
    code: string;
    name: string;
    nativeName?: string;
    flag?: string;
  }>;
  showFlags?: boolean;
  className?: string;
  onChange?: (language: string) => void;
}) {
  const { i18n } = useTranslation();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    if (onChange) {
      onChange(newLanguage);
    }
  };

  return (
    <select className={className} value={i18n.language} onChange={handleChange}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {showFlags && lang.flag ? `${lang.flag} ` : ""}
          {lang.nativeName || lang.name}
        </option>
      ))}
    </select>
  );
}
