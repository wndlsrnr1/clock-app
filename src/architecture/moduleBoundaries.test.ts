import { createRequire } from "node:module";
import { cruise, type IConfiguration } from "dependency-cruiser";
import { describe, expect, it } from "vitest";

function loadConfiguration(): IConfiguration {
  const loadCommonJsModule = createRequire(import.meta.url);
  return loadCommonJsModule("../../.dependency-cruiser.cjs") as IConfiguration;
}

describe("module boundaries", (): void => {
  it("accepts the production dependency graph", async (): Promise<void> => {
    const configuration = loadConfiguration();
    const result = await cruise(["src"], {
      ...configuration.options,
      outputType: "err",
      ruleSet: {
        allowed: configuration.allowed,
        allowedSeverity: configuration.allowedSeverity,
        forbidden: configuration.forbidden,
        required: configuration.required,
      },
      validate: true,
    });

    expect(result.exitCode, String(result.output)).toBe(0);
  });

  it("rejects a representative Todo deep import", async (): Promise<void> => {
    const result = await cruise(["test-fixtures/architecture/forbiddenTodoDeepImport.ts"], {
      baseDir: process.cwd(),
      outputType: "err",
      ruleSet: {
        forbidden: [{
          name: "todo-internals-are-private",
          severity: "error",
          from: { path: "^(?!src/contexts/todo/)" },
          to: { path: "^src/contexts/todo/(?!public(?:-model)?\\.ts$|composition\\.ts$)" },
        }],
      },
      tsConfig: { fileName: "tsconfig.json" },
      validate: true,
    });

    expect(result.exitCode).toBe(1);
  });
});
