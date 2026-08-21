import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";
import { RhythmRuntime } from "./RhythmRuntime";
import type { NotificationPort, SchedulerPort, SoundPort, SystemClock, TrayPort } from "./ports";
import type { RhythmConfigurationReader } from "./ports/RhythmConfigurationReader";
import { scheduleNextRhythmEvent } from "./scheduleNextRhythmEvent";
import { snapshotRhythmStatus } from "./snapshotRhythmStatus";

export class StartRhythmUseCase {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly configurationReader: RhythmConfigurationReader,
    private readonly scheduler: SchedulerPort,
    private readonly sound: SoundPort,
    private readonly tray: TrayPort,
    private readonly clock: SystemClock,
    private readonly notification: NotificationPort | null = null,
  ) {}

  public async execute(): Promise<RhythmStatusSnapshot> {
    const configuration = await this.configurationReader.get();
    this.runtime.start(configuration);
    await this.sound.prepare();
    scheduleNextRhythmEvent(this.runtime, this.scheduler, this.notification, this.sound, this.clock);
    await this.tray.updateStatus(this.runtime.session.status);

    return snapshotRhythmStatus(this.runtime);
  }
}

