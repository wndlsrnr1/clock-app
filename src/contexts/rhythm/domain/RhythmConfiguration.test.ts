import { describe, expect, it } from "vitest";
import { DailyRhythm } from "./DailyRhythm";
import { DurationMinutes } from "./DurationMinutes";
import { RhythmConfiguration } from "./RhythmConfiguration";

describe("RhythmConfiguration", (): void => {
  it("builds a schedule without theme, locale, sound, or auto-start settings", (): void => {
    const configuration = RhythmConfiguration.create({
      dailyRhythm: DailyRhythm.default(),
      focusTerm: DurationMinutes.create(50),
      restTerm: DurationMinutes.create(10),
    });

    expect(configuration.schedule().nextEventAfter(new Date(2026, 7, 22, 5, 0)).kind).toBe("focusEnds");
  });
});
