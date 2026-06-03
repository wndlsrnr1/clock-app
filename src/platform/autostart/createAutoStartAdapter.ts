import type { AutoStartPort } from "../../contexts/rhythm/application/ports";
import type { AutoStartConfiguration } from "./AutoStartConfiguration";
import type { CommandExecutor } from "./CommandExecutor";
import { LinuxAutoStartAdapter } from "./LinuxAutoStartAdapter";
import { MacOSAutoStartAdapter } from "./MacOSAutoStartAdapter";
import { UnsupportedAutoStartAdapter } from "./UnsupportedAutoStartAdapter";
import { WindowsAutoStartAdapter } from "./WindowsAutoStartAdapter";

export type PlatformName = "windows" | "macos" | "linux" | "unknown";

export function createAutoStartAdapter(
  platformName: PlatformName,
  commandExecutor: CommandExecutor,
  configuration: AutoStartConfiguration,
): AutoStartPort {
  if (platformName === "windows") {
    return new WindowsAutoStartAdapter(commandExecutor, configuration);
  }

  if (platformName === "macos") {
    return new MacOSAutoStartAdapter(commandExecutor, configuration);
  }

  if (platformName === "linux") {
    return new LinuxAutoStartAdapter(commandExecutor, configuration);
  }

  return new UnsupportedAutoStartAdapter();
}

