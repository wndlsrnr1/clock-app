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
    const editingRule = css.match(/\.time-picker-direct-entry\.editing \.time-picker-direct-display\s*\{(?<body>[^}]*)\}/);
    const focusRule = css.match(/\.time-picker-direct-entry:focus-within \.time-picker-direct-display\s*\{(?<body>[^}]*)\}/);

    expect(entryInputRule?.groups?.body).toContain("opacity: 0;");
    expect(entryInputRule?.groups?.body).toContain("border: 0;");
    expect(entryInputRule?.groups?.body).toContain("background: transparent;");
    expect(entryInputRule?.groups?.body).toContain("padding: 0;");
    expect(displayRule?.groups?.body).toContain("grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);");
    expect(displayRule?.groups?.body).toContain("font-variant-numeric: tabular-nums;");
    expect(editingRule?.groups?.body).toContain("border-color: color-mix(in srgb, var(--accent-focus), transparent 42%);");
    expect(focusRule?.groups?.body).toContain("border-color: color-mix(in srgb, var(--accent-focus), transparent 50%);");
  });

  it("reserves feedback space below fields so validation does not shift the panel", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const labelRowRule = css.match(/\.field-label-row\s*\{(?<body>[^}]*)\}/);
    const labelInRowRule = css.match(/\.field-label-row \.label\s*\{(?<body>[^}]*)\}/);
    const metaRule = css.match(/\.field-meta-pill\s*\{(?<body>[^}]*)\}/);
    const feedbackRule = css.match(/\.field-feedback\s*\{(?<body>[^}]*)\}/);
    const feedbackTextRule = css.match(/\.field-feedback \.field-error,\s*\.field-feedback \.input-hint\s*\{(?<body>[^}]*)\}/);
    const todoTitleFieldRule = css.match(/\.todo-title-field\s*\{(?<body>[^}]*)\}/);

    expect(labelRowRule?.groups?.body).toContain("display: flex;");
    expect(labelRowRule?.groups?.body).toContain("margin-bottom:");
    expect(labelInRowRule?.groups?.body).toContain("margin-bottom: 0;");
    expect(labelInRowRule?.groups?.body).toContain("line-height: 1.35;");
    expect(metaRule?.groups?.body).toContain("white-space: nowrap;");
    expect(feedbackRule?.groups?.body).toContain("min-height:");
    expect(feedbackTextRule?.groups?.body).toContain("margin: 0;");
    expect(todoTitleFieldRule?.groups?.body).toContain("display: grid;");
    expect(todoTitleFieldRule?.groups?.body).toContain("align-content: start;");
  });
});

describe("app shell styles", () => {
  it("defines the current theme and all imported palette themes with the core color tokens", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const themeIds = [
      "current",
      "tokyo-night",
      "one-dark-pro",
      "catppuccin-mocha",
      "nord",
      "dracula-official",
      "gruvbox",
      "monokai-pro",
      "night-owl",
      "synthwave-84",
      "ayu-mirage-dark",
    ];
    const requiredTokens = [
      "--app-bg",
      "--surface",
      "--surface-strong",
      "--text-main",
      "--text-muted",
      "--accent-a",
      "--accent-b",
      "--danger",
      "--border-soft",
      "--glow-a",
      "--glow-b",
      "--button-text-on-accent",
    ];

    for (const themeId of themeIds) {
      const themeRule = css.match(new RegExp(`\\[data-theme="${themeId}"\\]\\s*\\{(?<body>[^}]*)\\}`));

      expect(themeRule?.groups?.body, `${themeId} theme rule`).toBeTruthy();
      for (const token of requiredTokens) {
        expect(themeRule?.groups?.body, `${themeId} ${token}`).toContain(`${token}:`);
      }
    }
  });

  it("drives the app shell and main surfaces from theme tokens", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const appShellRule = css.match(/\.app-shell\s*\{(?<body>[^}]*)\}/);
    const boxRule = css.match(/\.box\s*\{(?<body>[^}]*)\}/);
    const segmentedActiveRule = css.match(/\.segmented-control-button\.active\s*\{(?<body>[^}]*)\}/);

    expect(appShellRule?.groups?.body).toContain("var(--app-bg)");
    expect(boxRule?.groups?.body).toContain("var(--surface)");
    expect(boxRule?.groups?.body).toContain("var(--border-soft)");
    expect(segmentedActiveRule?.groups?.body).toContain("var(--accent-a)");
    expect(segmentedActiveRule?.groups?.body).toContain("var(--accent-b)");
  });

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

  it("keeps data management as a standalone page surface", () => {
    const css = readFileSync(join(process.cwd(), "src/ui/styles.css"), "utf-8");
    const dataPageRule = css.match(/\.data-page\s*\{(?<body>[^}]*)\}/);

    expect(dataPageRule?.groups?.body).toContain("display: grid;");
    expect(dataPageRule?.groups?.body).toContain("align-content: start;");
  });
});
