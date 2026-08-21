import type { AutoStartPort } from "../../contexts/preferences/application/ports/AutoStartPort";

export class UnsupportedAutoStartAdapter implements AutoStartPort {
  public async enable(): Promise<void> {
    throw new Error("Auto start is not supported on this operating system.");
  }

  public async disable(): Promise<void> {
    return Promise.resolve();
  }

  public async isEnabled(): Promise<boolean> {
    return false;
  }
}

