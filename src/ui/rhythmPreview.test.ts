import { describe, expect, it } from "vitest";
import { previewRhythmSettings } from "./rhythmPreview";

describe("previewRhythmSettings", () => {
  it("previews the next alarm from the current draft settings", () => {
    expect(previewRhythmSettings({
      autoStartEnabled: false,
      dailyEnd: "23:55",
      dailyStart: "23:00",
      focusMinutes: 1,
      restMinutes: 1,
    }, new Date("2026-06-02T23:00:00"))).toEqual({
      isOutsideDailyRhythm: false,
      nextAlarmTime: "23:01",
      status: "ready",
    });
  });

  it("marks the preview as outside the rhythm window without hiding the next alarm", () => {
    expect(previewRhythmSettings({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 50,
      restMinutes: 10,
    }, new Date("2026-06-02T23:00:00"))).toEqual({
      isOutsideDailyRhythm: true,
      nextAlarmTime: "05:50",
      status: "ready",
    });
  });

  it("returns invalid when the draft settings cannot form a schedule", () => {
    expect(previewRhythmSettings({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "2360",
      focusMinutes: 50,
      restMinutes: 10,
    }, new Date("2026-06-02T05:00:00"))).toEqual({ status: "invalid" });

    expect(previewRhythmSettings({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 181,
      restMinutes: 10,
    }, new Date("2026-06-02T05:00:00"))).toEqual({ status: "invalid" });
  });
});
