import type { AutoStartPort } from "../../application/ports/AutoStartPort";

export class BrowserAutoStartAdapter implements AutoStartPort {
  public async enable(): Promise<void> {}

  public async disable(): Promise<void> {}

  public async isEnabled(): Promise<boolean> {
    return false;
  }
}
