import { describe, expect, it } from "vitest";
import { calendarDays } from "./calendarDays";

describe("calendarDays", () => {
  it("returns a six-week calendar grid with blank cells around the current month", () => {
    const days = calendarDays("2026-06");

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({ date: null, day: null, isCurrentMonth: false });
    expect(days[1]).toEqual({ date: "2026-06-01", day: 1, isCurrentMonth: true });
    expect(days[30]).toEqual({ date: "2026-06-30", day: 30, isCurrentMonth: true });
    expect(days[31]).toEqual({ date: null, day: null, isCurrentMonth: false });
    expect(days[41]).toEqual({ date: null, day: null, isCurrentMonth: false });
  });
});
