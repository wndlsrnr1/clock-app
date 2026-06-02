import { describe, expect, it } from "vitest";
import { TodoItem, type TodoItemSnapshot } from "../domain/TodoItem";
import {
  AddTodoUseCase,
  DeleteTodoUseCase,
  GetTodoCalendarSummaryUseCase,
  GetTodosByDateUseCase,
  ToggleTodoUseCase,
  UpdateTodoUseCase,
} from "./TodoUseCases";
import type { TodoClock, TodoIdGenerator, TodoRepository } from "./ports";

class InMemoryTodoRepository implements TodoRepository {
  public constructor(private todos: Array<TodoItem> = []) {}

  public async getAll(): Promise<Array<TodoItem>> {
    return this.todos;
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    this.todos = todos;
  }
}

class FixedIdGenerator implements TodoIdGenerator {
  public nextId(): string {
    return "todo-1";
  }
}

class FixedTodoClock implements TodoClock {
  public now(): Date {
    return new Date("2026-06-02T09:00:00");
  }
}

function createUseCases(repository: TodoRepository): {
  addTodo: AddTodoUseCase;
  getTodosByDate: GetTodosByDateUseCase;
  toggleTodo: ToggleTodoUseCase;
  updateTodo: UpdateTodoUseCase;
  deleteTodo: DeleteTodoUseCase;
  getCalendarSummary: GetTodoCalendarSummaryUseCase;
} {
  const clock = new FixedTodoClock();

  return {
    addTodo: new AddTodoUseCase(repository, new FixedIdGenerator(), clock),
    deleteTodo: new DeleteTodoUseCase(repository),
    getCalendarSummary: new GetTodoCalendarSummaryUseCase(repository),
    getTodosByDate: new GetTodosByDateUseCase(repository),
    toggleTodo: new ToggleTodoUseCase(repository, clock),
    updateTodo: new UpdateTodoUseCase(repository, clock),
  };
}

describe("Todo use cases", () => {
  it("adds a simple todo and reads it by date", async () => {
    const repository = new InMemoryTodoRepository();
    const useCases = createUseCases(repository);

    await useCases.addTodo.execute({ date: "2026-06-02", title: "오늘 과제" });
    const todos = await useCases.getTodosByDate.execute("2026-06-02");

    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ id: "todo-1", time: null, title: "오늘 과제" });
  });

  it("toggles, edits, and deletes a todo", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "운동" }),
    ]);
    const useCases = createUseCases(repository);

    const completed = await useCases.toggleTodo.execute("todo-1");
    const updated = await useCases.updateTodo.execute({ date: "2026-06-03", id: "todo-1", time: "07:30", title: "아침 운동" });
    await useCases.deleteTodo.execute("todo-1");
    const remaining = await repository.getAll();

    expect(completed.completed).toBe(true);
    expect(updated).toMatchObject({ date: "2026-06-03", time: "07:30", title: "아침 운동" } satisfies Partial<TodoItemSnapshot>);
    expect(remaining).toHaveLength(0);
  });

  it("returns month summaries for the calendar page", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", id: "todo-2", now: new Date("2026-06-02T08:00:00"), title: "B" }).complete(new Date("2026-06-02T09:00:00")),
    ]);
    const useCases = createUseCases(repository);

    const summary = await useCases.getCalendarSummary.execute("2026-06");

    expect(summary["2026-06-02"]).toEqual({ completed: 1, total: 2 });
  });
});
