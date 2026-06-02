import { describe, expect, it } from "vitest";
import { createTranslator, textCatalogs } from "./textCatalog";

describe("text catalog", () => {
  it("keeps Korean and English catalog keys aligned", () => {
    expect(flattenKeys(textCatalogs.en)).toEqual(flattenKeys(textCatalogs.kor));
  });

  it("translates rhythm status values by language", () => {
    expect(createTranslator("kor").status.values.idle).toBe("대기");
    expect(createTranslator("en").status.values.idle).toBe("Idle");
  });

  it("translates the top-level data tab by language", () => {
    expect(createTranslator("kor").navigation.data).toBe("데이터");
    expect(createTranslator("en").navigation.data).toBe("Data");
  });

  it("uses focus window wording for user-facing rhythm copy", () => {
    const koreanTextValues = collectTextValues(createTranslator("kor"));
    const englishTextValues = collectTextValues(createTranslator("en"));

    expect(createTranslator("kor").rhythm.settings.dailyStart).toBe("집중 시간대 시작");
    expect(createTranslator("kor").rhythm.settings.outsideDailyRhythm).toBe("현재는 집중 시간대 밖입니다.");
    expect(createTranslator("en").rhythm.settings.dailyStart).toBe("Focus window start");
    expect(createTranslator("en").rhythm.settings.outsideDailyRhythm).toBe("Current time is outside the focus window.");
    expect(koreanTextValues.every((text: string): boolean => !text.includes("리듬"))).toBe(true);
    expect(englishTextValues.every((text: string): boolean => !/rhythm/i.test(text))).toBe(true);
  });
});

function flattenKeys(value: unknown, prefix = ""): Array<string> {
  if (!isRecord(value)) {
    return [prefix];
  }

  return Object.keys(value)
    .sort()
    .flatMap((key: string): Array<string> => flattenKeys(value[key], prefix ? `${prefix}.${key}` : key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectTextValues(value: unknown): Array<string> {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item: unknown): Array<string> => collectTextValues(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.values(value).flatMap((item: unknown): Array<string> => collectTextValues(item));
}
