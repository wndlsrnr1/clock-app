import type { LanguagePreference } from "../contexts/preferences/domain/UserPreferences";
import enCatalog from "../contexts/preferences/locales/en.json";
import korCatalog from "../contexts/preferences/locales/kor.json";

export type TextCatalog = typeof korCatalog;

export const textCatalogs: Record<LanguagePreference, TextCatalog> = {
  en: enCatalog,
  kor: korCatalog,
};

export function createTranslator(language: LanguagePreference): TextCatalog {
  return textCatalogs[language];
}

export function formatText(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message: string, [key, value]: [string, string | number]): string => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
