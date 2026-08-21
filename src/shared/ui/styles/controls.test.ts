import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/shared/ui/styles/controls.css"), "utf-8");

describe("shared control styles", (): void => {
  it("keeps time picker option lists in two side-by-side sections", (): void => {
    const columnsRule = css.match(/\.time-picker-columns\s*\{(?<body>[^}]*)\}/);
    const optionsRule = css.match(/\.time-picker-options\s*\{(?<body>[^}]*)\}/);

    expect(columnsRule?.groups?.body).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);");
    expect(optionsRule?.groups?.body).toContain("grid-template-columns: 1fr;");
  });

  it("centers the time picker as a fixed modal", (): void => {
    const modalRule = css.match(/\.time-picker-modal\s*\{(?<body>[^}]*)\}/);

    expect(modalRule?.groups?.body).toContain("position: fixed;");
    expect(modalRule?.groups?.body).toContain("inset: 0;");
    expect(modalRule?.groups?.body).toContain("place-items: center;");
  });

  it("uses visible time slots and reserves validation feedback space", (): void => {
    const inputRule = css.match(/\.time-picker-direct-entry input\s*\{(?<body>[^}]*)\}/);
    const displayRule = css.match(/\.time-picker-direct-display\s*\{(?<body>[^}]*)\}/);
    const feedbackRule = css.match(/\.field-feedback\s*\{(?<body>[^}]*)\}/);

    expect(inputRule?.groups?.body).toContain("opacity: 0;");
    expect(displayRule?.groups?.body).toContain("font-variant-numeric: tabular-nums;");
    expect(feedbackRule?.groups?.body).toContain("min-height:");
  });
});
