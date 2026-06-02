import { describe, expect, it } from "vitest";
import { TodoItem } from "../domain/TodoItem";
import { SyncGoogleTodosUseCase } from "./SyncGoogleTodosUseCase";
import type { TodoRepository, TodoSyncPort, TodoSyncResult } from "./ports";

class InMemoryTodoRepository implements TodoRepository {
  public constructor(private todos: Array<TodoItem>) {}

  public async getAll(): Promise<Array<TodoItem>> {
    return this.todos;
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    this.todos = todos;
  }
}

class FakeTodoSyncPort implements TodoSyncPort {
  public async sync(todos: Array<TodoItem>): Promise<TodoSyncResult> {
    return {
      deleted: 1,
      imported: 1,
      todos: [
        ...todos.map((todo: TodoItem): TodoItem => todo.connectGoogleTask("google-1", new Date("2026-06-02T09:00:00"))),
        TodoItem.create({
          date: "2026-06-03",
          googleTaskId: "google-2",
          id: "todo-2",
          now: new Date("2026-06-02T09:00:00"),
          title: "가져온 할 일",
        }),
      ],
      uploaded: 1,
      updated: 0,
    };
  }
}

describe("SyncGoogleTodosUseCase", () => {
  it("saves the merged local-first todo result from the sync port", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "로컬 할 일" }),
    ]);
    const useCase = new SyncGoogleTodosUseCase(repository, new FakeTodoSyncPort());

    const result = await useCase.execute();
    const saved = await repository.getAll();

    expect(result.uploaded).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.deleted).toBe(1);
    expect(saved.map((todo: TodoItem): string => todo.snapshot().title)).toEqual(["로컬 할 일", "가져온 할 일"]);
  });
});
