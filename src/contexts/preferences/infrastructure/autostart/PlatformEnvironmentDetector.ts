import { os } from "@neutralinojs/lib";
import { currentNeutralinoOperatingSystem } from "../../../../platform/neutralino/NeutralinoRuntimeGlobals";
import type { PlatformName } from "./createAutoStartAdapter";

export class PlatformEnvironmentDetector {
  public async detect(): Promise<PlatformName> {
    const globalOsName = currentNeutralinoOperatingSystem().toLowerCase();

    if (globalOsName) {
      return this.platformNameFrom(globalOsName);
    }

    const envs = await os.getEnvs();
    const osName = String(envs.NL_OS ?? "").toLowerCase();

    return this.platformNameFrom(osName);
  }

  private platformNameFrom(osName: string): PlatformName {
    if (osName.includes("windows")) {
      return "windows";
    }

    if (osName.includes("darwin") || osName.includes("mac")) {
      return "macos";
    }

    if (osName.includes("linux")) {
      return "linux";
    }

    return "unknown";
  }
}
