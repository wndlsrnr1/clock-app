import { describe, expect, it } from "vitest";
import { formatText } from "./formatText";

describe("formatText", (): void => {
  it("replaces every named placeholder with its value", (): void => {
    expect(formatText("{count} / {max}", { count: 3, max: 10 })).toBe("3 / 10");
  });
});
