import { describe, expect, it } from "vitest";
import { normalizeOptionalTimeText } from "./normalizeTimeText";

describe("normalizeOptionalTimeText", () => {
  it("stores empty time text as null", () => {
    expect(normalizeOptionalTimeText("")).toBeNull();
    expect(normalizeOptionalTimeText("   ")).toBeNull();
  });

  it("normalizes compact and colon time text to HH:mm", () => {
    expect(normalizeOptionalTimeText("1430")).toBe("14:30");
    expect(normalizeOptionalTimeText("14:30")).toBe("14:30");
    expect(normalizeOptionalTimeText("05:00")).toBe("05:00");
  });

  it("rejects invalid time text", () => {
    expect(() => normalizeOptionalTimeText("24:00")).toThrow("Time must use HH:mm format.");
    expect(() => normalizeOptionalTimeText("12:99")).toThrow("Time must use HH:mm format.");
    expect(() => normalizeOptionalTimeText("abc")).toThrow("Time must use HH:mm format.");
  });
});
