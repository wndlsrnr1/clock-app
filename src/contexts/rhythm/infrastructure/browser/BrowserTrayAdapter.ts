import type { TrayPort } from "../../application/ports";

export class BrowserTrayAdapter implements TrayPort {
  public async updateStatus(): Promise<void> {}
}
