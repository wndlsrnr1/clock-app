import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("time picker styles", () => {
  it("keeps hour and minute sections side by side while each option list uses one column", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const columnsRule = css.match(/\.time-picker-columns\s*\{(?<body>[^}]*)\}/);
    const optionsRule = css.match(/\.time-picker-options\s*\{(?<body>[^}]*)\}/);

    expect(columnsRule?.groups?.body).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);");
    expect(optionsRule?.groups?.body).toContain("grid-template-columns: 1fr;");
    expect(optionsRule?.groups?.body).not.toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
  });

  it("centers the time picker as a fixed modal instead of a clipped popover", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const modalRule = css.match(/\.time-picker-modal\s*\{(?<body>[^}]*)\}/);

    expect(css).not.toContain(".time-picker-popover");
    expect(modalRule?.groups?.body).toContain("position: fixed;");
    expect(modalRule?.groups?.body).toContain("inset: 0;");
    expect(modalRule?.groups?.body).toContain("display: grid;");
    expect(modalRule?.groups?.body).toContain("place-items: center;");
  });
});

describe("app shell styles", () => {
  it("keeps the outer app frame fixed while page content changes", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const appShellRule = css.match(/\.app-shell\s*\{(?<body>[^}]*)\}/);
    const boxRule = css.match(/\.box\s*\{(?<body>[^}]*)\}/);

    expect(appShellRule?.groups?.body).toContain("height: 100vh;");
    expect(appShellRule?.groups?.body).toContain("overflow: hidden;");
    expect(boxRule?.groups?.body).toContain("height: calc(100vh - 2.5rem);");
    expect(boxRule?.groups?.body).toContain("overflow-y: auto;");
  });
});
