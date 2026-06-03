import { DailyRhythm } from "./DailyRhythm";
import { DurationMinutes } from "./DurationMinutes";
import type { RhythmEvent, RhythmEventKind } from "./RhythmEvent";

export interface RhythmScheduleProperties {
  dailyRhythm: DailyRhythm;
  focusTerm: DurationMinutes;
  restTerm: DurationMinutes;
}

export class RhythmSchedule {
  private constructor(
    private readonly dailyRhythm: DailyRhythm,
    private readonly focusTerm: DurationMinutes,
    private readonly restTerm: DurationMinutes,
  ) {}

  public static create(properties: RhythmScheduleProperties): RhythmSchedule {
    return new RhythmSchedule(properties.dailyRhythm, properties.focusTerm, properties.restTerm);
  }

  public static default(): RhythmSchedule {
    return RhythmSchedule.create({
      dailyRhythm: DailyRhythm.default(),
      focusTerm: DurationMinutes.create(50),
      restTerm: DurationMinutes.create(10),
    });
  }

  public nextEventAfter(fromDate: Date): RhythmEvent {
    const candidates = this.collectCandidateEvents(fromDate);
    const nextEvent = candidates
      .filter((event) => event.occursAt.getTime() > fromDate.getTime())
      .sort((left, right) => left.occursAt.getTime() - right.occursAt.getTime())[0];

    if (!nextEvent) {
      throw new Error("Unable to find the next rhythm event.");
    }

    return nextEvent;
  }

  private collectCandidateEvents(fromDate: Date): RhythmEvent[] {
    const events: RhythmEvent[] = [];

    for (let offset = -1; offset <= 3; offset += 1) {
      const windowStart = this.windowStartFor(fromDate, offset);
      events.push(...this.eventsForWindow(windowStart));
    }

    return events;
  }

  private windowStartFor(fromDate: Date, dayOffset: number): Date {
    const start = new Date(fromDate.getTime());
    start.setDate(start.getDate() + dayOffset);
    start.setHours(this.dailyRhythm.start.hour, this.dailyRhythm.start.minute, 0, 0);

    return start;
  }

  private windowEndFor(windowStart: Date): Date {
    const end = new Date(windowStart.getTime());
    end.setHours(this.dailyRhythm.end.hour, this.dailyRhythm.end.minute, 0, 0);

    if (this.dailyRhythm.crossesMidnight()) {
      end.setDate(end.getDate() + 1);
    }

    return end;
  }

  private eventsForWindow(windowStart: Date): RhythmEvent[] {
    const events: RhythmEvent[] = [];
    const windowEnd = this.windowEndFor(windowStart);
    let occursAt = this.addMinutes(windowStart, this.focusTerm.value);
    let kind: RhythmEventKind = "focusEnds";

    while (occursAt.getTime() <= windowEnd.getTime()) {
      events.push({ kind, occursAt: new Date(occursAt.getTime()) });
      occursAt = this.addMinutes(occursAt, kind === "focusEnds" ? this.restTerm.value : this.focusTerm.value);
      kind = kind === "focusEnds" ? "restEnds" : "focusEnds";
    }

    return events;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
}

