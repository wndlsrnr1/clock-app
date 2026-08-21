import { storage } from "@neutralinojs/lib";
import type { TodoRepository } from "../../application/ports";
import { TodoItem, type TodoItemSnapshot } from "../../domain/TodoItem";
import type { NeutralinoStoragePort } from "../../../../platform/neutralino/NeutralinoSettingsRepository";

export class NeutralinoTodoRepository implements TodoRepository {
  private readonly key = "todos";

  public constructor(private readonly neutralinoStorage: NeutralinoStoragePort = storage) {}

  public async getAll(): Promise<Array<TodoItem>> {
    try {
      const savedText = await this.neutralinoStorage.getData(this.key);
      const snapshots = JSON.parse(savedText) as Array<TodoItemSnapshot>;

      return snapshots.map((snapshot: TodoItemSnapshot): TodoItem => TodoItem.restore(snapshot));
    } catch {
      return [];
    }
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    const snapshots = todos.map((todo: TodoItem): TodoItemSnapshot => todo.snapshot());
    await this.neutralinoStorage.setData(this.key, JSON.stringify(snapshots));
  }
}
