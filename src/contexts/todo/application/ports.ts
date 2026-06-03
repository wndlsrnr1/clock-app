import type { TodoItem } from "../domain/TodoItem";

export interface TodoRepository {
  getAll(): Promise<Array<TodoItem>>;
  saveAll(todos: Array<TodoItem>): Promise<void>;
}

export interface TodoIdGenerator {
  nextId(): string;
}

export interface TodoClock {
  now(): Date;
}
