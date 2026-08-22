import { cruise } from "dependency-cruiser";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("shared module", (): void => {
  it("does not depend on app, contexts, or features", async (): Promise<void> => {
    const result = await cruise(["src/shared"], {
      baseDir: process.cwd(),
      doNotFollow: { path: "node_modules" },
      outputType: "err",
      tsPreCompilationDeps: true,
      ruleSet: {
        forbidden: [{
          name: "shared-is-domain-neutral",
          severity: "error",
          from: { path: "^src/shared" },
          to: { path: "^src/(app|contexts|features)" },
        }],
      },
      tsConfig: { fileName: "tsconfig.json" },
      validate: true,
    });

    expect(result.exitCode, String(result.output)).toBe(0);
  });

  it("keeps shared UI contracts free of context-owned text and selectors", (): void => {
    const timePickerSource = readFileSync(join(process.cwd(), "src/shared/ui/components/TimePickerField.tsx"), "utf-8");
    const controlsCss = readFileSync(join(process.cwd(), "src/shared/ui/styles/controls.css"), "utf-8");

    expect(timePickerSource).not.toContain("TextCatalog");
    expect(timePickerSource).not.toContain("text.todo");
    expect(controlsCss).not.toMatch(/\.(?:todo-(?:form|edit|panel)|rhythm-toolbar|sound-panel|calendar-page|data-panel|selected-day-panel)\b/);
  });
});
