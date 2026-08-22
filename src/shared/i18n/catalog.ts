import type { LanguagePreference } from "./LanguagePreference";
import enCatalog from "./locales/en.json";
import korCatalog from "./locales/kor.json";

export type TextCatalog = typeof korCatalog;

export const textCatalogs: Record<LanguagePreference, TextCatalog> = {
  en: enCatalog,
  kor: korCatalog,
};

export function createTranslator(language: LanguagePreference): TextCatalog {
  return textCatalogs[language];
}
