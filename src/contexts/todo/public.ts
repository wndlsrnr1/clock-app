import type {
  AddTodoCommand,
  ReorderTodosCommand,
  UpdateTodoCommand,
} from "./application/TodoUseCases";
import type { TodoItemSnapshot } from "./domain/TodoItem";
import type { TodoDaySummary } from "./domain/TodoList";

export {
  AddTodoUseCase,
  DeleteTodoUseCase,
  GetTodoCalendarSummaryUseCase,
  GetTodosByDateUseCase,
  ReorderTodosUseCase,
  ToggleTodoUseCase,
  UpdateTodoUseCase,
  type AddTodoCommand,
  type ReorderTodosCommand,
  type UpdateTodoCommand,
} from "./application/TodoUseCases";
export { TodoItem, type TodoItemSnapshot } from "./domain/TodoItem";
export type { TodoDaySummary } from "./domain/TodoList";
export { ExportTodoSnapshotsUseCase } from "./application/commands/ExportTodoSnapshotsUseCase";
export { ReplaceTodoSnapshotsUseCase } from "./application/commands/ReplaceTodoSnapshotsUseCase";

export interface TodoModule {
  add: { execute(command: AddTodoCommand): Promise<TodoItemSnapshot> };
  delete: { execute(id: string): Promise<TodoItemSnapshot | void> };
  getCalendarSummary: { execute(month: string): Promise<Record<string, TodoDaySummary>> };
  getByDate: { execute(date: string): Promise<Array<TodoItemSnapshot>> };
  reorder: { execute(command: ReorderTodosCommand): Promise<Array<TodoItemSnapshot>> };
  toggle: { execute(id: string): Promise<TodoItemSnapshot | void> };
  update: { execute(command: UpdateTodoCommand): Promise<TodoItemSnapshot> };
}
