import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("keeps preference themes, settings, and sound controls colocated", (): void => {
  const css = readFileSync(join(process.cwd(), "src/contexts/preferences/presentation/preferences.css"), "utf-8");

  expect(css).toContain(".theme-card.selected");
  expect(css).toContain(".settings-disclosure__content");
  expect(css).toContain(".volume-slider-wrap");
});
