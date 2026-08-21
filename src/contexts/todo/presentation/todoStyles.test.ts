import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("keeps Todo list and calendar selectors in the Todo module", (): void => {
  const css = readFileSync(join(process.cwd(), "src/contexts/todo/presentation/todo.css"), "utf-8");

  expect(css).toContain(".todo-row.dragging");
  expect(css).toContain(".calendar-grid");
  expect(css).toContain(".calendar-day.today::after");
});
