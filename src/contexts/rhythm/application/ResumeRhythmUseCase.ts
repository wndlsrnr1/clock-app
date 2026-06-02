import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";
import { RhythmRuntime } from "./RhythmRuntime";
import type { NotificationPort, SchedulerPort, SoundPort, SystemClock, TrayPort } from "./ports";
import { scheduleNextRhythmEvent } from "./scheduleNextRhythmEvent";
import { snapshotRhythmStatus } from "./snapshotRhythmStatus";

export class ResumeRhythmUseCase {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly scheduler: SchedulerPort,
    private readonly tray: TrayPort,
    private readonly clock: SystemClock,
    private readonly notification: NotificationPort | null = null,
    private readonly sound: SoundPort | null = null,
  ) {}

  public async execute(): Promise<RhythmStatusSnapshot> {
    this.runtime.session.resume();
    scheduleNextRhythmEvent(this.runtime, this.scheduler, this.notification, this.sound, this.clock);
    await this.tray.updateStatus(this.runtime.session.status);

    return snapshotRhythmStatus(this.runtime);
  }
}

