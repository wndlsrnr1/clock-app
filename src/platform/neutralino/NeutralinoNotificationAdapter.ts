import { Icon, os } from "@neutralinojs/lib";
import type { NotificationPort } from "../../contexts/rhythm/application/ports";
import type { RhythmEvent } from "../../contexts/rhythm/domain/RhythmEvent";

export class NeutralinoNotificationAdapter implements NotificationPort {
  public async notify(event: RhythmEvent): Promise<void> {
    const title = event.kind === "focusEnds" ? "휴식 시간입니다" : "다시 집중할 시간입니다";
    const content = event.kind === "focusEnds" ? "집중 시간이 끝났습니다." : "휴식 시간이 끝났습니다.";

    await os.showNotification(title, content, Icon.INFO);
  }
}
