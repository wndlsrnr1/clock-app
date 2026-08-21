import type { TodoRepository } from "../../application/ports";
import { TodoItem, type TodoItemSnapshot } from "../../domain/TodoItem";

export class BrowserTodoRepository implements TodoRepository {
  private readonly key = "clock-rhythm-preview-todos";

  public constructor(private readonly storage: Storage = localStorage) {}

  public async getAll(): Promise<Array<TodoItem>> {
    const savedText = this.storage.getItem(this.key);

    if (!savedText) {
      return [];
    }

    try {
      return (JSON.parse(savedText) as Array<TodoItemSnapshot>)
        .map((snapshot: TodoItemSnapshot): TodoItem => TodoItem.restore(snapshot));
    } catch {
      return [];
    }
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    this.storage.setItem(
      this.key,
      JSON.stringify(todos.map((todo: TodoItem): TodoItemSnapshot => todo.snapshot())),
    );
  }
}
