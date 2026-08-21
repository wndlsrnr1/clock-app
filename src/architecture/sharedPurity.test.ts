import { cruise } from "dependency-cruiser";
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
});
