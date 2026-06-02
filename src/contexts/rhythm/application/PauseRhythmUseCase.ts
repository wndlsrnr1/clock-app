import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";
import { RhythmRuntime } from "./RhythmRuntime";
import type { SchedulerPort, TrayPort } from "./ports";
import { snapshotRhythmStatus } from "./snapshotRhythmStatus";

export class PauseRhythmUseCase {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly scheduler: SchedulerPort,
    private readonly tray: TrayPort,
  ) {}

  public async execute(): Promise<RhythmStatusSnapshot> {
    const taskId = this.runtime.takeScheduledTaskId();

    if (taskId) {
      this.scheduler.cancel(taskId);
    }

    this.runtime.session.pause();
    await this.tray.updateStatus(this.runtime.session.status);

    return snapshotRhythmStatus(this.runtime);
  }
}

