import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("keeps data transfer page and confirmation selectors in the feature", (): void => {
  const css = readFileSync(join(process.cwd(), "src/features/data-transfer/presentation/data-transfer.css"), "utf-8");

  expect(css).toContain(".data-page");
  expect(css).toContain(".confirm-modal");
  expect(css).toContain(".backup-summary");
});
