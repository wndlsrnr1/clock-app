import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("sizes the analog clock from the app-owned layout token", (): void => {
  const css = readFileSync(join(process.cwd(), "src/contexts/rhythm/presentation/rhythm.css"), "utf-8");
  const clockRule = css.match(/\.analog-clock\s*\{(?<body>[^}]*)\}/);

  expect(clockRule?.groups?.body).toContain("width: var(--clock-stage-size);");
  expect(css).toContain("transform-origin: 50% calc(var(--clock-stage-size) / 2 - 0.625rem);");
});
