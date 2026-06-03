import { ClockTime } from "./ClockTime";

export interface DailyRhythmProperties {
  start: ClockTime;
  end: ClockTime;
}

export class DailyRhythm {
  private constructor(
    public readonly start: ClockTime,
    public readonly end: ClockTime,
  ) {}

  public static create(properties: DailyRhythmProperties): DailyRhythm {
    return new DailyRhythm(properties.start, properties.end);
  }

  public static default(): DailyRhythm {
    return DailyRhythm.create({
      start: ClockTime.fromText("05:00"),
      end: ClockTime.fromText("18:00"),
    });
  }

  public crossesMidnight(): boolean {
    return this.start.totalMinutes > this.end.totalMinutes;
  }

  public includes(date: Date): boolean {
    const time = ClockTime.fromDate(date).totalMinutes;

    if (!this.crossesMidnight()) {
      return time >= this.start.totalMinutes && time <= this.end.totalMinutes;
    }

    return time >= this.start.totalMinutes || time <= this.end.totalMinutes;
  }
}

