import { describe, expect, it, vi } from "vitest";
import { TodoItem, type TodoItemSnapshot } from "../../domain/TodoItem";
import { ReplaceTodoSnapshotsUseCase } from "./ReplaceTodoSnapshotsUseCase";

describe("ReplaceTodoSnapshotsUseCase", (): void => {
  it("restores validated Todo items before saving imported snapshots", async (): Promise<void> => {
    const snapshot: TodoItemSnapshot = {
      completed: false,
      createdAt: "2026-08-22T00:00:00.000Z",
      date: "2026-08-22",
      displayOrder: 0,
      id: "todo-1",
      time: null,
      title: "Imported todo",
      updatedAt: "2026-08-22T00:00:00.000Z",
    };
    const saveAll = vi.fn<(todos: Array<TodoItem>) => Promise<void>>(() => Promise.resolve());
    const useCase = new ReplaceTodoSnapshotsUseCase({ getAll: async () => [], saveAll });

    await useCase.execute([snapshot]);

    const savedTodo = saveAll.mock.calls[0]?.[0]?.[0];
    expect(savedTodo).toBeInstanceOf(TodoItem);
    expect(savedTodo?.snapshot()).toEqual(snapshot);
  });
});
