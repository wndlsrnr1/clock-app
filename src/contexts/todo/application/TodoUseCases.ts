import { TodoItem, type TodoItemSnapshot } from "../domain/TodoItem";
import { TodoList, type TodoDaySummary } from "../domain/TodoList";
import type { Clock } from "../../../shared/time/Clock";
import type { TodoIdGenerator, TodoRepository } from "./ports";

export interface AddTodoCommand {
  title: string;
  date: string;
  time?: string | null;
}

export interface UpdateTodoCommand {
  id: string;
  title: string;
  date: string;
  time: string | null;
}

export interface ReorderTodosCommand {
  date: string;
  orderedIds: Array<string>;
}

export class AddTodoUseCase {
  public constructor(
    private readonly todoRepository: TodoRepository,
    private readonly idGenerator: TodoIdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(command: AddTodoCommand): Promise<TodoItemSnapshot> {
    const todos = await this.todoRepository.getAll();
    const todo = TodoItem.create({
      date: command.date,
      displayOrder: nextDisplayOrderForDate(todos, command.date),
      id: this.idGenerator.nextId(),
      now: this.clock.now(),
      time: command.time ?? null,
      title: command.title,
    });

    await this.todoRepository.saveAll([...todos, todo]);

    return todo.snapshot();
  }
}

export class GetTodosByDateUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(date: string): Promise<Array<TodoItemSnapshot>> {
    return TodoList.from(await this.todoRepository.getAll()).forDate(date);
  }
}

export class ToggleTodoUseCase {
  public constructor(
    private readonly todoRepository: TodoRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(id: string): Promise<TodoItemSnapshot> {
    const todos = await this.todoRepository.getAll();
    const target = todos.find((todo: TodoItem): boolean => todo.todoId === id);

    if (!target) {
      throw new Error("Todo was not found.");
    }

    const updatedTodo = target.isCompleted ? target.reopen(this.clock.now()) : target.complete(this.clock.now());
    await this.todoRepository.saveAll(todos.map((todo: TodoItem): TodoItem => (todo.todoId === id ? updatedTodo : todo)));

    return updatedTodo.snapshot();
  }
}

export class UpdateTodoUseCase {
  public constructor(
    private readonly todoRepository: TodoRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(command: UpdateTodoCommand): Promise<TodoItemSnapshot> {
    const todos = await this.todoRepository.getAll();
    const target = todos.find((todo: TodoItem): boolean => todo.todoId === command.id);

    if (!target) {
      throw new Error("Todo was not found.");
    }

    const renamedTodo = target.rename(command.title, this.clock.now());
    const displayOrder = target.todoDate === command.date
      ? target.todoDisplayOrder
      : nextDisplayOrderForDate(todos, command.date);
    const updatedTodo = renamedTodo.reschedule(command.date, command.time, this.clock.now(), displayOrder);

    await this.todoRepository.saveAll(todos.map((todo: TodoItem): TodoItem => (todo.todoId === command.id ? updatedTodo : todo)));

    return updatedTodo.snapshot();
  }
}

export class ReorderTodosUseCase {
  public constructor(
    private readonly todoRepository: TodoRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(command: ReorderTodosCommand): Promise<Array<TodoItemSnapshot>> {
    const todos = await this.todoRepository.getAll();
    const orderedTodos = command.orderedIds.map((id: string): TodoItem => findTodoOrThrow(todos, id));

    ReorderTodosUseCase.ensureSameDate(command.date, orderedTodos);
    ReorderTodosUseCase.ensureSameCompletionGroup(orderedTodos);
    ReorderTodosUseCase.ensureEntireGroupIncluded(todos, command.date, orderedTodos);

    const orderById = new Map(command.orderedIds.map((id: string, index: number): [string, number] => [id, index]));
    const now = this.clock.now();
    const reorderedTodos = todos.map((todo: TodoItem): TodoItem => {
      const displayOrder = orderById.get(todo.todoId);
      return displayOrder === undefined ? todo : todo.moveToDisplayOrder(displayOrder, now);
    });

    await this.todoRepository.saveAll(reorderedTodos);

    return TodoList.from(reorderedTodos).forDate(command.date);
  }

  private static ensureSameDate(date: string, todos: Array<TodoItem>): void {
    if (todos.some((todo: TodoItem): boolean => todo.todoDate !== date)) {
      throw new Error("Todo reorder can only include todos from the selected date.");
    }
  }

  private static ensureSameCompletionGroup(todos: Array<TodoItem>): void {
    const firstTodo = todos[0];

    if (!firstTodo) {
      return;
    }

    if (todos.some((todo: TodoItem): boolean => todo.isCompleted !== firstTodo.isCompleted)) {
      throw new Error("Todo reorder cannot mix completed and incomplete todos.");
    }
  }

  private static ensureEntireGroupIncluded(allTodos: Array<TodoItem>, date: string, orderedTodos: Array<TodoItem>): void {
    const firstTodo = orderedTodos[0];

    if (!firstTodo) {
      return;
    }

    const orderedIds = new Set(orderedTodos.map((todo: TodoItem): string => todo.todoId));
    const groupTodos = allTodos.filter((todo: TodoItem): boolean => todo.todoDate === date && todo.isCompleted === firstTodo.isCompleted);

    if (groupTodos.some((todo: TodoItem): boolean => !orderedIds.has(todo.todoId))) {
      throw new Error("Todo reorder must include the entire completion group.");
    }
  }
}

export class DeleteTodoUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(id: string): Promise<void> {
    const todos = await this.todoRepository.getAll();
    await this.todoRepository.saveAll(todos.filter((todo: TodoItem): boolean => todo.todoId !== id));
  }
}

function findTodoOrThrow(todos: Array<TodoItem>, id: string): TodoItem {
  const todo = todos.find((candidate: TodoItem): boolean => candidate.todoId === id);

  if (!todo) {
    throw new Error("Todo was not found.");
  }

  return todo;
}

function nextDisplayOrderForDate(todos: Array<TodoItem>, date: string): number {
  const displayOrders = todos
    .filter((todo: TodoItem): boolean => todo.todoDate === date)
    .map((todo: TodoItem): number => todo.todoDisplayOrder);

  if (displayOrders.length === 0) {
    return 0;
  }

  return Math.max(...displayOrders) + 1;
}

export class GetTodoCalendarSummaryUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(month: string): Promise<Record<string, TodoDaySummary>> {
    return TodoList.from(await this.todoRepository.getAll()).calendarSummary(month);
  }
}
