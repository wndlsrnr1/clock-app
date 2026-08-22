import { TodoItem, type TodoItemSnapshot } from "../../domain/TodoItem";
import type { TodoRepository } from "../ports";

export class ReplaceTodoSnapshotsUseCase {
  public constructor(private readonly todoRepository: TodoRepository) {}

  public async execute(snapshots: Array<TodoItemSnapshot>): Promise<void> {
    await this.todoRepository.saveAll(snapshots.map((snapshot): TodoItem => TodoItem.restore(snapshot)));
  }
}
