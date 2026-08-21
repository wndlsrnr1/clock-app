import { UserPreferences } from "../contexts/preferences/domain/UserPreferences";
import { TodoTitle } from "../contexts/todo/public";
import { formatText, type TextCatalog } from "./textCatalog";
import { normalizeOptionalTimeText } from "../shared/time/normalizeTimeText";

export interface TextInputValidation {
  error: string | null;
  isValid: boolean;
  counter: string | null;
}

export interface MinuteInputValidation {
  error: string | null;
  hint: string;
  isValid: boolean;
  meta: string;
}

export const todoTitleMaxLength = TodoTitle.maxLength;

export function validateTodoTitleInput(value: string, text: TextCatalog): TextInputValidation {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {
      counter: null,
      error: text.todo.validation.titleRequired,
      isValid: false,
    };
  }

  if (value.length > TodoTitle.maxLength) {
    return {
      counter: todoTitleCounter(value.length, text),
      error: formatText(text.todo.validation.titleTooLong, { max: TodoTitle.maxLength }),
      isValid: false,
    };
  }

  return {
    counter: value.length >= 120 ? todoTitleCounter(value.length, text) : null,
    error: null,
    isValid: true,
  };
}

export function validateMinuteInput(value: string, min: number, max: number, text: TextCatalog): MinuteInputValidation {
  const hint = formatText(text.rhythm.settings.minuteRange, { max, min });
  const meta = formatText(text.rhythm.settings.minuteMeta, { max, min });
  const numberValue = Number(value);

  if (!/^\d+$/.test(value) || !Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    return {
      error: hint,
      hint,
      isValid: false,
      meta,
    };
  }

  return {
    error: null,
    hint,
    isValid: true,
    meta,
  };
}

export function isOptionalTimeInputValid(value: string): boolean {
  try {
    normalizeOptionalTimeText(value);
    return true;
  } catch {
    return false;
  }
}

export const rhythmMinuteRanges = {
  focus: UserPreferences.focusMinutesRange,
  rest: UserPreferences.restMinutesRange,
} as const;

function todoTitleCounter(count: number, text: TextCatalog): string {
  return formatText(text.todo.validation.titleCounter, { count, max: TodoTitle.maxLength });
}
