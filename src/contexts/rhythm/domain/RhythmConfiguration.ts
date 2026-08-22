import type { DailyRhythm } from "./DailyRhythm";
import type { DurationMinutes } from "./DurationMinutes";
import { RhythmSchedule } from "./RhythmSchedule";

export interface RhythmConfigurationProperties {
  dailyRhythm: DailyRhythm;
  focusTerm: DurationMinutes;
  restTerm: DurationMinutes;
}

export class RhythmConfiguration {
  private constructor(
    public readonly dailyRhythm: DailyRhythm,
    public readonly focusTerm: DurationMinutes,
    public readonly restTerm: DurationMinutes,
  ) {}

  public static create(properties: RhythmConfigurationProperties): RhythmConfiguration {
    return new RhythmConfiguration(properties.dailyRhythm, properties.focusTerm, properties.restTerm);
  }

  public schedule(): RhythmSchedule {
    return RhythmSchedule.create({
      dailyRhythm: this.dailyRhythm,
      focusTerm: this.focusTerm,
      restTerm: this.restTerm,
    });
  }
}
