export function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function quoteShell(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

