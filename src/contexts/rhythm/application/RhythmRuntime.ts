import { UserPreferences } from "../../preferences/domain/UserPreferences";
import { RhythmSchedule } from "../domain/RhythmSchedule";
import { RhythmSession } from "../domain/RhythmSession";

export class RhythmRuntime {
  private scheduledTaskId: string | null = null;

  private constructor(
    private currentSession: RhythmSession,
    public preferences: UserPreferences,
  ) {}

  public static empty(): RhythmRuntime {
    return new RhythmRuntime(RhythmSession.idle(), UserPreferences.default());
  }

  public get session(): RhythmSession {
    return this.currentSession;
  }

  public replacePreferences(preferences: UserPreferences): void {
    this.preferences = preferences;
  }

  public start(preferences: UserPreferences): RhythmSchedule {
    this.preferences = preferences;
    this.currentSession = RhythmSession.start();

    return this.currentSchedule();
  }

  public currentSchedule(): RhythmSchedule {
    return RhythmSchedule.create({
      dailyRhythm: this.preferences.dailyRhythm,
      focusTerm: this.preferences.focusMinutes,
      restTerm: this.preferences.restMinutes,
    });
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
