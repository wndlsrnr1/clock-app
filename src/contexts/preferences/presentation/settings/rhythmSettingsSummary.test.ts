import { describe, expect, it } from "vitest";
import { createTranslator } from "../../../../ui/textCatalog";
import { UserPreferences, type UserPreferencesSnapshot } from "../../public";
import { createRhythmSettingsSummary } from "./rhythmSettingsSummary";

function preferences(overrides: Partial<UserPreferencesSnapshot> = {}): UserPreferencesSnapshot {
  return {
    autoStartEnabled: false,
    dailyEnd: "18:00",
    dailyStart: "05:00",
    focusMinutes: 50,
    initialSetupCompleted: true,
    language: "kor",
    notificationSound: UserPreferences.default().notificationSound,
    restMinutes: 10,
    theme: "current",
    ...overrides,
  };
}

describe("createRhythmSettingsSummary", () => {
  it("summarizes saved rhythm and notification settings", () => {
    const text = createTranslator("kor");
    const summary = createRhythmSettingsSummary({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 50,
      restMinutes: 10,
    }, preferences(), { isOutsideDailyRhythm: false, nextAlarmTime: "05:50", status: "ready" }, text);

    expect(summary.text).toBe("50분 집중 · 10분 휴식 · 05:00-18:00 · 기본");
    expect(summary.chips).toEqual([]);
    expect(summary.isDirty).toBe(false);
    expect(summary.shouldOpenOnInitialRender).toBe(false);
  });

  it("marks unsaved and invalid rhythm settings without hiding the warning", () => {
    const text = createTranslator("kor");
    const summary = createRhythmSettingsSummary({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "",
      focusMinutes: 45,
      restMinutes: 10,
    }, preferences(), { status: "invalid" }, text);

    expect(summary.chips).toContain("저장 필요");
    expect(summary.chips).toContain("시간 설정 오류");
    expect(summary.isDirty).toBe(true);
    expect(summary.isInvalid).toBe(true);
    expect(summary.shouldOpenOnInitialRender).toBe(true);
  });

  it("surfaces sound and daily rhythm warnings in the collapsed summary", () => {
    const text = createTranslator("kor");
    const muted = UserPreferences.default().toggleNotificationSoundMute();
    const summary = createRhythmSettingsSummary({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 50,
      restMinutes: 10,
    }, preferences({ notificationSound: muted.notificationSound }), { isOutsideDailyRhythm: true, nextAlarmTime: "05:50", status: "ready" }, text);

    expect(summary.text).toBe("50분 집중 · 10분 휴식 · 05:00-18:00 · 무음");
    expect(summary.chips).toContain("무음");
    expect(summary.chips).toContain("집중 시간대 밖");
  });

  it("opens on first launch until preferences are saved once", () => {
    const text = createTranslator("kor");
    const summary = createRhythmSettingsSummary({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 50,
      restMinutes: 10,
    }, preferences({ initialSetupCompleted: false }), { isOutsideDailyRhythm: false, nextAlarmTime: "05:50", status: "ready" }, text);

    expect(summary.shouldOpenOnInitialRender).toBe(true);
  });
});
