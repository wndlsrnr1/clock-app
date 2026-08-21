import {
  AddTodoUseCase,
  DeleteTodoUseCase,
  GetTodoCalendarSummaryUseCase,
  GetTodosByDateUseCase,
  ReorderTodosUseCase,
  ToggleTodoUseCase,
  UpdateTodoUseCase,
} from "./application/TodoUseCases";
import type { TodoClock, TodoIdGenerator, TodoRepository } from "./application/ports";
import type { TodoModule } from "./public";

export function createTodoModule(
  repository: TodoRepository,
  idGenerator: TodoIdGenerator,
  clock: TodoClock,
): TodoModule {
  return {
    add: new AddTodoUseCase(repository, idGenerator, clock),
    delete: new DeleteTodoUseCase(repository),
    getByDate: new GetTodosByDateUseCase(repository),
    getCalendarSummary: new GetTodoCalendarSummaryUseCase(repository),
    reorder: new ReorderTodosUseCase(repository, clock),
    toggle: new ToggleTodoUseCase(repository, clock),
    update: new UpdateTodoUseCase(repository, clock),
  };
}
