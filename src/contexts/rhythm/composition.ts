import { GetRhythmStatusUseCase } from "./application/GetRhythmStatusUseCase";
import { PauseRhythmUseCase } from "./application/PauseRhythmUseCase";
import { ResumeRhythmUseCase } from "./application/ResumeRhythmUseCase";
import type { RhythmRuntime } from "./application/RhythmRuntime";
import { StartRhythmUseCase } from "./application/StartRhythmUseCase";
import { StopRhythmForTodayUseCase } from "./application/StopRhythmForTodayUseCase";
import type { Clock } from "../../shared/time/Clock";
import type { NotificationPort, SchedulerPort, SoundPort, TrayPort } from "./application/ports";
import type { RhythmConfigurationReader } from "./application/ports/RhythmConfigurationReader";
import type { RhythmModule } from "./public";

export function createRhythmModule(
  runtime: RhythmRuntime,
  configurationReader: RhythmConfigurationReader,
  scheduler: SchedulerPort,
  sound: SoundPort,
  tray: TrayPort,
  clock: Clock,
  notification: NotificationPort,
): RhythmModule {
  return {
    getStatus: new GetRhythmStatusUseCase(runtime),
    pause: new PauseRhythmUseCase(runtime, scheduler, tray),
    resume: new ResumeRhythmUseCase(runtime, scheduler, tray, clock, notification, sound),
    start: new StartRhythmUseCase(runtime, configurationReader, scheduler, sound, tray, clock, notification),
    stopForToday: new StopRhythmForTodayUseCase(runtime, scheduler, tray, clock),
  };
}
