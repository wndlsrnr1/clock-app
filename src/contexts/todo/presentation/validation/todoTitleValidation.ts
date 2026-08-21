import type { TextCatalog } from "../../../../shared/i18n/catalog";
import { formatText } from "../../../../shared/i18n/formatText";
import { TodoTitle } from "../../public";

export interface TextInputValidation {
  error: string | null;
  isValid: boolean;
  counter: string | null;
}

export const todoTitleMaxLength = TodoTitle.maxLength;

export function validateTodoTitleInput(value: string, text: TextCatalog): TextInputValidation {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return { counter: null, error: text.todo.validation.titleRequired, isValid: false };
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

function todoTitleCounter(count: number, text: TextCatalog): string {
  return formatText(text.todo.validation.titleCounter, { count, max: TodoTitle.maxLength });
}
