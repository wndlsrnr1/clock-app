import { describe, expect, it } from "vitest";
import { TodoItem, type TodoItemSnapshot } from "../domain/TodoItem";
import {
  AddTodoUseCase,
  DeleteTodoUseCase,
  GetTodoCalendarSummaryUseCase,
  GetTodosByDateUseCase,
  ReorderTodosUseCase,
  ToggleTodoUseCase,
  UpdateTodoUseCase,
} from "./TodoUseCases";
import type { Clock } from "../../../shared/time/Clock";
import type { TodoIdGenerator, TodoRepository } from "./ports";

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

class FixedTodoClock implements Clock {
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
  reorderTodos: ReorderTodosUseCase;
} {
  const clock = new FixedTodoClock();

  return {
    addTodo: new AddTodoUseCase(repository, new FixedIdGenerator(), clock),
    deleteTodo: new DeleteTodoUseCase(repository),
    getCalendarSummary: new GetTodoCalendarSummaryUseCase(repository),
    getTodosByDate: new GetTodosByDateUseCase(repository),
    reorderTodos: new ReorderTodosUseCase(repository, clock),
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
    expect(todos[0]).toMatchObject({ displayOrder: 0, id: "todo-1", time: null, title: "오늘 과제" });
  });

  it("toggles, edits, and deletes a todo", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "운동" }),
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

  it("adds new todos at the end of their date order", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 4, id: "todo-existing", now: new Date("2026-06-02T08:00:00"), title: "기존" }),
    ]);
    const useCase = new AddTodoUseCase(repository, new FixedIdGenerator(), new FixedTodoClock());

    const added = await useCase.execute({ date: "2026-06-02", title: "추가" });

    expect(added.displayOrder).toBe(5);
  });

  it("moves completed todos below incomplete todos without changing their display order", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 1, id: "todo-2", now: new Date("2026-06-02T08:00:00"), title: "B" }),
    ]);
    const useCases = createUseCases(repository);

    const completed = await useCases.toggleTodo.execute("todo-1");
    const todos = await useCases.getTodosByDate.execute("2026-06-02");

    expect(completed.displayOrder).toBe(0);
    expect(todos.map((todo: TodoItemSnapshot): string => todo.title)).toEqual(["B", "A"]);
  });

  it("moves a todo to the end of the target date order when its date changes", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "이동" }),
      TodoItem.create({ date: "2026-06-03", displayOrder: 3, id: "todo-2", now: new Date("2026-06-02T08:00:00"), title: "대상 날짜 기존" }),
    ]);
    const useCases = createUseCases(repository);

    const updated = await useCases.updateTodo.execute({ date: "2026-06-03", id: "todo-1", time: null, title: "이동" });

    expect(updated.displayOrder).toBe(4);
  });

  it("reorders todos within the same completion group for a date", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 1, id: "todo-2", now: new Date("2026-06-02T08:00:00"), title: "B" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 2, id: "todo-3", now: new Date("2026-06-02T08:00:00"), title: "C" }),
    ]);
    const useCases = createUseCases(repository);

    await useCases.reorderTodos.execute({ date: "2026-06-02", orderedIds: ["todo-3", "todo-1", "todo-2"] });
    const todos = await useCases.getTodosByDate.execute("2026-06-02");

    expect(todos.map((todo: TodoItemSnapshot): string => todo.title)).toEqual(["C", "A", "B"]);
    expect(todos.map((todo: TodoItemSnapshot): number => todo.displayOrder)).toEqual([0, 1, 2]);
  });

  it("rejects reordering mixed completed and incomplete todos", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 1, id: "todo-2", now: new Date("2026-06-02T08:00:00"), title: "B" })
        .complete(new Date("2026-06-02T09:00:00")),
    ]);
    const useCases = createUseCases(repository);

    await expect(useCases.reorderTodos.execute({ date: "2026-06-02", orderedIds: ["todo-2", "todo-1"] }))
      .rejects.toThrow("Todo reorder cannot mix completed and incomplete todos.");
  });

  it("returns month summaries for the calendar page", async () => {
    const repository = new InMemoryTodoRepository([
      TodoItem.create({ date: "2026-06-02", displayOrder: 0, id: "todo-1", now: new Date("2026-06-02T08:00:00"), title: "A" }),
      TodoItem.create({ date: "2026-06-02", displayOrder: 1, id: "todo-2", now: new Date("2026-06-02T08:00:00"), title: "B" }).complete(new Date("2026-06-02T09:00:00")),
    ]);
    const useCases = createUseCases(repository);

    const summary = await useCases.getCalendarSummary.execute("2026-06");

    expect(summary["2026-06-02"]).toEqual({ completed: 1, total: 2 });
  });
});
