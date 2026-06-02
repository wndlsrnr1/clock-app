import { describe, expect, it } from "vitest";
import { ClockTime } from "./ClockTime";
import { DailyRhythm } from "./DailyRhythm";
import { DurationMinutes } from "./DurationMinutes";
import { RhythmSchedule } from "./RhythmSchedule";

function expectLocalMinute(date: Date, expected: string): void {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  expect(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${hours}:${minutes}:${seconds}`).toBe(expected);
}

describe("RhythmSchedule", () => {
  it("ends the first focus term at the 50-minute boundary", () => {
    const schedule = RhythmSchedule.create({
      dailyRhythm: DailyRhythm.create({
        start: ClockTime.fromText("05:00"),
        end: ClockTime.fromText("18:00"),
      }),
      focusTerm: DurationMinutes.create(50),
      restTerm: DurationMinutes.create(10),
    });

    const event = schedule.nextEventAfter(new Date("2026-06-02T05:10:00"));

    expect(event.kind).toBe("focusEnds");
    expectLocalMinute(event.occursAt, "2026-06-02T05:50:00");
  });

  it("ends the rest term at the next hour boundary", () => {
    const schedule = RhythmSchedule.default();

    const event = schedule.nextEventAfter(new Date("2026-06-02T05:50:01"));

    expect(event.kind).toBe("restEnds");
    expectLocalMinute(event.occursAt, "2026-06-02T06:00:00");
  });

  it("moves to the next active day after the daily rhythm ends", () => {
    const schedule = RhythmSchedule.default();

    const event = schedule.nextEventAfter(new Date("2026-06-02T18:00:01"));

    expect(event.kind).toBe("focusEnds");
    expectLocalMinute(event.occursAt, "2026-06-03T05:50:00");
  });

  it("schedules a one minute focus boundary inside a late night rhythm window", () => {
    const schedule = RhythmSchedule.create({
      dailyRhythm: DailyRhythm.create({
        start: ClockTime.fromText("23:00"),
        end: ClockTime.fromText("23:55"),
      }),
      focusTerm: DurationMinutes.create(1),
      restTerm: DurationMinutes.create(1),
    });

    const event = schedule.nextEventAfter(new Date("2026-06-02T23:00:00"));

    expect(event.kind).toBe("focusEnds");
    expectLocalMinute(event.occursAt, "2026-06-02T23:01:00");
  });

  it("supports active windows that cross midnight", () => {
    const schedule = RhythmSchedule.create({
      dailyRhythm: DailyRhythm.create({
        start: ClockTime.fromText("22:00"),
        end: ClockTime.fromText("02:00"),
      }),
      focusTerm: DurationMinutes.create(50),
      restTerm: DurationMinutes.create(10),
    });

    const event = schedule.nextEventAfter(new Date("2026-06-03T02:00:01"));

    expect(event.kind).toBe("focusEnds");
    expectLocalMinute(event.occursAt, "2026-06-03T22:50:00");
  });
});
