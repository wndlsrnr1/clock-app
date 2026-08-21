export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function currentMonthKey(date: Date): string {
  return formatDateKey(date).slice(0, 7);
}

export function addMonthsToMonthKey(month: string, offset: number): string {
  const [yearText, monthText] = month.split("-");
  const target = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);

  return currentMonthKey(target);
}

export function formatMonthLabel(month: string, language: LanguagePreference = "kor"): string {
  const [yearText, monthText] = month.split("-");

  if (language === "en") {
    const date = new Date(Number(yearText), Number(monthText) - 1, 1);
    return `${date.toLocaleString("en-US", { month: "long" })} ${yearText}`;
  }

  return `${yearText}년 ${monthText}월`;
}
import type { LanguagePreference } from "../../../../shared/i18n/LanguagePreference";
