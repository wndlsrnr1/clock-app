import { normalizeOptionalTimeText } from "../../../../shared/time/normalizeTimeText";
import { ClockTime, DailyRhythm, DurationMinutes, RhythmConfiguration } from "../../../rhythm/public-model";
import { UserPreferences } from "../../domain/UserPreferences";
import type { UpdatePreferencesCommand } from "../UpdatePreferencesUseCase";

export type RhythmSettingsPreview =
  | { status: "invalid" }
  | { status: "ready"; nextAlarmTime: string; isOutsideDailyRhythm: boolean };

export function previewRhythmSettings(form: UpdatePreferencesCommand, now: Date): RhythmSettingsPreview {
  try {
    assertPreferenceMinuteRange(form.focusMinutes, UserPreferences.focusMinutesRange);
    assertPreferenceMinuteRange(form.restMinutes, UserPreferences.restMinutesRange);
    const dailyStart = requiredTime(form.dailyStart);
    const dailyEnd = requiredTime(form.dailyEnd);
    const dailyRhythm = DailyRhythm.create({
      end: ClockTime.fromText(dailyEnd),
      start: ClockTime.fromText(dailyStart),
    });
    const schedule = RhythmConfiguration.create({
      dailyRhythm,
      focusTerm: DurationMinutes.create(form.focusMinutes),
      restTerm: DurationMinutes.create(form.restMinutes),
    }).schedule();
    const nextEvent = schedule.nextEventAfter(now);

    return {
      isOutsideDailyRhythm: !dailyRhythm.includes(now),
      nextAlarmTime: `${String(nextEvent.occursAt.getHours()).padStart(2, "0")}:${String(nextEvent.occursAt.getMinutes()).padStart(2, "0")}`,
      status: "ready",
    };
  } catch {
    return { status: "invalid" };
  }
}

function assertPreferenceMinuteRange(value: number, range: { min: number; max: number }): void {
  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    throw new Error("Minute value is outside preference range.");
  }
}

function requiredTime(value: string): string {
  const normalizedTime = normalizeOptionalTimeText(value);

  if (!normalizedTime) {
    throw new Error("Time is required.");
  }

  return normalizedTime;
}
