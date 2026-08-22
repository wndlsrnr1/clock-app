import type { NotificationPort } from "../../application/ports";
import type { RhythmEvent } from "../../domain/RhythmEvent";

export class BrowserNotificationAdapter implements NotificationPort {
  public async notify(event: RhythmEvent): Promise<void> {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = event.kind === "focusEnds" ? "휴식 시간입니다" : "다시 집중할 시간입니다";
    new Notification(title);
  }
}
