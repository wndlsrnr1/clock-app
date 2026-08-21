export function formatText(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message: string, [key, value]: [string, string | number]): string => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
