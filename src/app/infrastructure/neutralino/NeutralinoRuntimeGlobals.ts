export function isNeutralinoRuntime(): boolean {
  return Boolean(globalThis.NL_TOKEN || globalThis.NL_PORT);
}

export function currentNeutralinoExecutablePath(): string {
  const firstArgument = globalThis.NL_ARGS?.[0];

  if (firstArgument && !firstArgument.startsWith("--")) {
    return firstArgument;
  }

  return globalThis.NL_PATH ?? "";
}

export function currentNeutralinoOperatingSystem(): string {
  return globalThis.NL_OS ?? "";
}
