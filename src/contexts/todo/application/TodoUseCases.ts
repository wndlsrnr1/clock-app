import { TodoItem, type TodoItemSnapshot } from "../domain/TodoItem";
import { TodoList, type TodoDaySummary } from "../domain/TodoList";
import type { TodoClock, TodoIdGenerator, TodoRepository } from "./ports";

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

export class AddTodoUseCase {
  public constructor(
    private readonly todoRepository: TodoRepository,
    private readonly idGenerator: TodoIdGenerator,
    private readonly clock: TodoClock,
  ) {}

  public async execute(command: AddTodoCommand): Promise<TodoItemSnapshot> {
    const todos = await this.todoRepository.getAll();
    const todo = TodoItem.create({
      date: command.date,
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
    private readonly clock: TodoClock,
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
    private readonly clock: TodoClock,
  ) {}

  public async execute(command: UpdateTodoCommand): Promise<TodoItemSnapshot> {
    const todos = await this.todoRepository.getAll();
    const target = todos.find((todo: TodoItem): boolean => todo.todoId === command.id);

    if (!target) {
      throw new Error("Todo was not found.");
    }

    const renamedTodo = target.rename(command.title, this.clock.now());
    const updatedTodo = renamedTodo.reschedule(command.date, command.time, this.clock.now());

    await this.todoRepository.saveAll(todos.map((todo: TodoItem): TodoItem => (todo.todoId === command.id ? updatedTodo : todo)));

    return updatedTodo.snapshot();
  }
}

export class DeleteTodoUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(id: string): Promise<void> {
    const todos = await this.todoRepository.getAll();
    await this.todoRepository.saveAll(todos.filter((todo: TodoItem): boolean => todo.todoId !== id));
  }
}

export class GetTodoCalendarSummaryUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(month: string): Promise<Record<string, TodoDaySummary>> {
    return TodoList.from(await this.todoRepository.getAll()).calendarSummary(month);
  }
}
