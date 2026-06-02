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
