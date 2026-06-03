import type { TodoIdGenerator } from "../../contexts/todo/application/ports";

export class BrowserTodoIdGenerator implements TodoIdGenerator {
  public nextId(): string {
    if ("randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `todo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
