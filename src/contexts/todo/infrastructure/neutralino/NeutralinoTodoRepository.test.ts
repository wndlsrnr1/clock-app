import { describe, expect, it } from "vitest";
import { TodoItem } from "../../domain/TodoItem";
import { NeutralinoTodoRepository } from "./NeutralinoTodoRepository";

class FakeStorage {
  public data = new Map<string, string>();

  public async getData(key: string): Promise<string> {
    const value = this.data.get(key);

    if (!value) {
      throw new Error("missing");
    }

    return value;
  }

  public async setData(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }
}

describe("NeutralinoTodoRepository", () => {
  it("returns an empty todo list when storage is empty", async () => {
    const repository = new NeutralinoTodoRepository(new FakeStorage());

    await expect(repository.getAll()).resolves.toEqual([]);
  });

  it("persists and restores todo snapshots", async () => {
    const storage = new FakeStorage();
    const repository = new NeutralinoTodoRepository(storage);
    const todo = TodoItem.create({
      date: "2026-06-02",
      id: "todo-1",
      now: new Date("2026-06-02T09:00:00"),
      time: "14:30",
      title: "운동",
    });

    await repository.saveAll([todo]);
    const restored = await repository.getAll();

    expect(restored[0]?.snapshot()).toMatchObject({
      date: "2026-06-02",
      id: "todo-1",
      time: "14:30",
      title: "운동",
    });
  });
});
