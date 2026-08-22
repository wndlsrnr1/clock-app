import type { TextCatalog } from "../../../../../shared/i18n/catalog";
import { formatText } from "../../../../../shared/i18n/formatText";
import { UserPreferences } from "../../../domain/UserPreferences";

export interface MinuteInputValidation {
  error: string | null;
  hint: string;
  isValid: boolean;
  meta: string;
}

export const rhythmMinuteRanges = {
  focus: UserPreferences.focusMinutesRange,
  rest: UserPreferences.restMinutesRange,
} as const;

export function validateMinuteInput(value: string, min: number, max: number, text: TextCatalog): MinuteInputValidation {
  const hint = formatText(text.rhythm.settings.minuteRange, { max, min });
  const meta = formatText(text.rhythm.settings.minuteMeta, { max, min });
  const numberValue = Number(value);

  if (!/^\d+$/.test(value) || !Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    return { error: hint, hint, isValid: false, meta };
  }

  return { error: null, hint, isValid: true, meta };
}
