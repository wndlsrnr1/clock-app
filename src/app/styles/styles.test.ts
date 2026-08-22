import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readStyle(name: string): string {
  return readFileSync(join(process.cwd(), "src/app/styles", name), "utf-8");
}

describe("app styles", (): void => {
  it("imports owner styles in an explicit cascade order", (): void => {
    expect(readStyle("index.css").trim().split(/\r?\n/)).toEqual([
      '@import "./foundation.css";',
      '@import "./shell.css";',
      '@import "../../shared/ui/styles/controls.css";',
      '@import "../../contexts/rhythm/presentation/rhythm.css";',
      '@import "../../contexts/preferences/presentation/preferences.css";',
      '@import "../../contexts/todo/presentation/todo.css";',
      '@import "../../features/data-transfer/presentation/data-transfer.css";',
    ]);
  });

  it("defines every theme with the core palette tokens", (): void => {
    const css = readStyle("foundation.css");
    const themeIds = ["current", "tokyo-night", "one-dark-pro", "catppuccin-mocha", "nord", "dracula-official", "gruvbox", "monokai-pro", "night-owl", "synthwave-84", "ayu-mirage-dark"];

    for (const themeId of themeIds) {
      const themeRule = css.match(new RegExp(`\\[data-theme="${themeId}"\\]\\s*\\{(?<body>[^}]*)\\}`));
      expect(themeRule?.groups?.body).toContain("--app-bg:");
      expect(themeRule?.groups?.body).toContain("--accent-a:");
      expect(themeRule?.groups?.body).toContain("--button-text-on-accent:");
    }
  });

  it("keeps the app frame fixed and delegates responsive module layout", (): void => {
    const css = readStyle("shell.css");
    const shellRule = css.match(/\.app-shell\s*\{(?<body>[^}]*)\}/);
    const boxRule = css.match(/\.box\s*\{(?<body>[^}]*)\}/);

    expect(shellRule?.groups?.body).toContain("height: 100vh;");
    expect(shellRule?.groups?.body).toContain("overflow: hidden;");
    expect(boxRule?.groups?.body).toContain("--clock-stage-size: min(17.5rem, 70vw);");
    expect(css).toContain(".box--verticalCompact .ui-grid");
    expect(css).not.toContain(".todo-form");
    expect(css).not.toContain(".calendar-layout");
    expect(css).not.toContain("  .grid,");
  });
});
