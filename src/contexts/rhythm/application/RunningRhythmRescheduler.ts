import { scheduleNextRhythmEvent } from "./scheduleNextRhythmEvent";
import type { RhythmRuntime } from "./RhythmRuntime";
import type { Clock } from "../../../shared/time/Clock";
import type { NotificationPort, SchedulerPort, SoundPort } from "./ports";

export class RunningRhythmRescheduler {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly scheduler: SchedulerPort,
    private readonly notification: NotificationPort | null,
    private readonly sound: SoundPort | null,
    private readonly clock: Clock,
  ) {}

  public rescheduleIfRunning(): void {
    if (this.runtime.session.status !== "running") {
      return;
    }

    const scheduledTaskId = this.runtime.takeScheduledTaskId();

    if (scheduledTaskId) {
      this.scheduler.cancel(scheduledTaskId);
    }

    scheduleNextRhythmEvent(this.runtime, this.scheduler, this.notification, this.sound, this.clock);
  }
}
