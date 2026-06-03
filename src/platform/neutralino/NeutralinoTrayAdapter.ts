import { events, os } from "@neutralinojs/lib";
import type { TrayPort } from "../../contexts/rhythm/application/ports";

export interface TrayActions {
  open(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stopForToday(): Promise<void>;
  quit(): Promise<void>;
}

export class NeutralinoTrayAdapter implements TrayPort {
  public constructor(private readonly iconPath: string) {}

  public async registerActions(actions: TrayActions): Promise<void> {
    await events.on("trayMenuItemClicked", (event: CustomEvent) => {
      void this.runAction(event.detail, actions);
    });
  }

  public async updateStatus(status: string): Promise<void> {
    await os.setTray({
      icon: this.iconPath,
      menuItems: [
        { id: "open", text: "열기" },
        { text: "-" },
        { id: "pause", text: "일시정지", isDisabled: status !== "running" },
        { id: "resume", text: "재개", isDisabled: status !== "paused" },
        { id: "stopForToday", text: "오늘 종료" },
        { text: "-" },
        { id: "quit", text: "완전 종료" },
      ],
    });
  }

  private async runAction(detail: unknown, actions: TrayActions): Promise<void> {
    const menuItemId = this.menuItemIdFrom(detail);

    if (menuItemId === "open") {
      await actions.open();
      return;
    }

    if (menuItemId === "pause") {
      await actions.pause();
      return;
    }

    if (menuItemId === "resume") {
      await actions.resume();
      return;
    }

    if (menuItemId === "stopForToday") {
      await actions.stopForToday();
      return;
    }

    if (menuItemId === "quit") {
      await actions.quit();
    }
  }

  private menuItemIdFrom(detail: unknown): string {
    if (!detail || typeof detail !== "object" || !("id" in detail)) {
      return "";
    }

    const id = detail.id;

    return typeof id === "string" ? id : "";
  }
}
