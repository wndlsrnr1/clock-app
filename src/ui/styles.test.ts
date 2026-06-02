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

  it("uses the visible time slots as the input surface", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const entryInputRule = css.match(/\.time-picker-direct-entry input\s*\{(?<body>[^}]*)\}/);
    const displayRule = css.match(/\.time-picker-direct-display\s*\{(?<body>[^}]*)\}/);
    const focusRule = css.match(/\.time-picker-direct-entry:focus-within \.time-picker-direct-display\s*\{(?<body>[^}]*)\}/);

    expect(entryInputRule?.groups?.body).toContain("opacity: 0;");
    expect(entryInputRule?.groups?.body).toContain("border: 0;");
    expect(entryInputRule?.groups?.body).toContain("background: transparent;");
    expect(entryInputRule?.groups?.body).toContain("padding: 0;");
    expect(displayRule?.groups?.body).toContain("grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);");
    expect(displayRule?.groups?.body).toContain("font-variant-numeric: tabular-nums;");
    expect(focusRule?.groups?.body).toContain("border-color: rgba(124, 253, 240, 0.42);");
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

  it("uses layout mode classes to drive clock rendering size", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const boxRule = css.match(/\.box\s*\{(?<body>[^}]*)\}/);
    const normalRule = css.match(/\.box--normal\s*\{(?<body>[^}]*)\}/);
    const verticalRule = css.match(/\.box--verticalCompact\s*\{(?<body>[^}]*)\}/);
    const verticalGridRule = css.match(/\.box--verticalCompact \.ui-grid\s*\{(?<body>[^}]*)\}/);
    const verticalCalendarRule = css.match(/\.box--verticalCompact \.calendar-layout\s*\{(?<body>[^}]*)\}/);
    const wideRule = css.match(/\.box--wideFocus\s*\{(?<body>[^}]*)\}/);
    const clockRule = css.match(/\.analog-clock\s*\{(?<body>[^}]*)\}/);
    const tickRule = css.match(/\.tick\s*\{(?<body>[^}]*)\}/);

    expect(boxRule?.groups?.body).toContain("--clock-stage-size: min(17.5rem, 70vw);");
    expect(normalRule?.groups?.body).toContain("--clock-stage-size: min(17.5rem, 70vw);");
    expect(verticalRule?.groups?.body).toContain("--clock-stage-size: min(34vh, 72vw, 18rem);");
    expect(verticalGridRule?.groups?.body).toContain("grid-template-columns: 1fr;");
    expect(verticalCalendarRule?.groups?.body).toContain("grid-template-columns: 1fr;");
    expect(wideRule?.groups?.body).toContain("--clock-stage-size: min(33vw, 28rem);");
    expect(clockRule?.groups?.body).toContain("width: var(--clock-stage-size);");
    expect(tickRule?.groups?.body).toContain("transform-origin: 50% calc(var(--clock-stage-size) / 2 - 0.625rem);");
  });
});
