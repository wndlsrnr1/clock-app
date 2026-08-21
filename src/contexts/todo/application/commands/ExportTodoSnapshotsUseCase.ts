import type { TodoItemSnapshot } from "../../domain/TodoItem";
import type { TodoRepository } from "../ports";

export class ExportTodoSnapshotsUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(): Promise<Array<TodoItemSnapshot>> {
    return (await this.todoRepository.getAll()).map((todo): TodoItemSnapshot => todo.snapshot());
  }
}
