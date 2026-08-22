import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";
import { RhythmRuntime } from "./RhythmRuntime";
import type { Clock } from "../../../shared/time/Clock";
import type { SchedulerPort, TrayPort } from "./ports";
import { snapshotRhythmStatus } from "./snapshotRhythmStatus";

export class StopRhythmForTodayUseCase {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly scheduler: SchedulerPort,
    private readonly tray: TrayPort,
    private readonly clock: Clock,
  ) {}

  public async execute(): Promise<RhythmStatusSnapshot> {
    const taskId = this.runtime.takeScheduledTaskId();

    if (taskId) {
      this.scheduler.cancel(taskId);
    }

    this.runtime.session.stopForToday(this.clock.now());
    await this.tray.updateStatus(this.runtime.session.status);

    return snapshotRhythmStatus(this.runtime);
  }
}

