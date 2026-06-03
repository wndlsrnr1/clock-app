export function normalizeOptionalTimeText(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = normalizedCandidate(trimmedValue);

  if (!/^\d{2}:\d{2}$/.test(normalizedValue)) {
    throw new Error("Time must use HH:mm format.");
  }

  const [hourText, minuteText] = normalizedValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (hour > 23 || minute > 59) {
    throw new Error("Time must use HH:mm format.");
  }

  return normalizedValue;
}

function normalizedCandidate(value: string): string {
  if (/^\d{4}$/.test(value)) {
    return `${value.slice(0, 2)}:${value.slice(2)}`;
  }

  return value;
}
