import { DailyRhythm } from "../domain/DailyRhythm";
import { DurationMinutes } from "../domain/DurationMinutes";
import { RhythmConfiguration } from "../domain/RhythmConfiguration";
import type { RhythmSchedule } from "../domain/RhythmSchedule";
import { RhythmSession } from "../domain/RhythmSession";

export class RhythmRuntime {
  private scheduledTaskId: string | null = null;

  private constructor(
    private currentSession: RhythmSession,
    private configuration: RhythmConfiguration,
  ) {}

  public static empty(): RhythmRuntime {
    return new RhythmRuntime(
      RhythmSession.idle(),
      RhythmConfiguration.create({
        dailyRhythm: DailyRhythm.default(),
        focusTerm: DurationMinutes.create(50),
        restTerm: DurationMinutes.create(10),
      }),
    );
  }

  public get session(): RhythmSession {
    return this.currentSession;
  }

  public replaceConfiguration(configuration: RhythmConfiguration): void {
    this.configuration = configuration;
  }

  public start(configuration: RhythmConfiguration): RhythmSchedule {
    this.configuration = configuration;
    this.currentSession = RhythmSession.start();

    return this.currentSchedule();
  }

  public currentSchedule(): RhythmSchedule {
    return this.configuration.schedule();
  }

  public configurationSnapshot(): RhythmConfiguration {
    return this.configuration;
  }

  public rememberTask(taskId: string): void {
    this.scheduledTaskId = taskId;
  }

  public takeScheduledTaskId(): string | null {
    const taskId = this.scheduledTaskId;
    this.scheduledTaskId = null;

    return taskId;
  }

}
