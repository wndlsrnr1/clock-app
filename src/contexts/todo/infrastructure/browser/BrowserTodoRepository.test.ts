import { beforeEach, describe, expect, it } from "vitest";
import { TodoItem, type TodoItemSnapshot } from "../../domain/TodoItem";
import { BrowserTodoRepository } from "./BrowserTodoRepository";

describe("BrowserTodoRepository", (): void => {
  beforeEach((): void => localStorage.clear());

  it("round-trips Todo snapshots through the preview storage key", async (): Promise<void> => {
    const snapshot: TodoItemSnapshot = {
      completed: false,
      createdAt: "2026-08-22T00:00:00.000Z",
      date: "2026-08-22",
      displayOrder: 0,
      id: "todo-1",
      time: "09:00",
      title: "Round trip",
      updatedAt: "2026-08-22T00:00:00.000Z",
    };
    const repository = new BrowserTodoRepository(localStorage);

    await repository.saveAll([TodoItem.restore(snapshot)]);
    const loaded = await repository.getAll();

    expect(loaded[0]?.snapshot()).toEqual(snapshot);
    expect(localStorage.getItem("clock-rhythm-preview-todos")).toContain("todo-1");
  });

  it("returns an empty collection for malformed preview data", async (): Promise<void> => {
    localStorage.setItem("clock-rhythm-preview-todos", "not json");

    await expect(new BrowserTodoRepository(localStorage).getAll()).resolves.toEqual([]);
  });
});
