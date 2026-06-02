import type { UpdatePreferencesCommand } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import { UserPreferences } from "../contexts/preferences/domain/UserPreferences";
import { ClockTime } from "../contexts/rhythm/domain/ClockTime";
import { DailyRhythm } from "../contexts/rhythm/domain/DailyRhythm";
import { DurationMinutes } from "../contexts/rhythm/domain/DurationMinutes";
import { RhythmSchedule } from "../contexts/rhythm/domain/RhythmSchedule";
import { normalizeOptionalTimeText } from "./timeText";

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
    const schedule = RhythmSchedule.create({
      dailyRhythm,
      focusTerm: DurationMinutes.create(form.focusMinutes),
      restTerm: DurationMinutes.create(form.restMinutes),
    });
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
