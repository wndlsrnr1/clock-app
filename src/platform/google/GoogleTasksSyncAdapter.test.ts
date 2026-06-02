import { describe, expect, it } from "vitest";
import type { TodoIdGenerator } from "../../contexts/todo/application/ports";
import { TodoItem } from "../../contexts/todo/domain/TodoItem";
import { GoogleTasksSyncAdapter, type GoogleTasksApiPort, type GoogleTasksSettingsPort } from "./GoogleTasksSyncAdapter";
import type { GoogleTaskPayload, GoogleTaskResource } from "./GoogleTasksMapper";

class FakeSettings implements GoogleTasksSettingsPort {
  public async getTaskListId(): Promise<string | null> {
    return "task-list-1";
  }
}

class FakeGoogleTasksApi implements GoogleTasksApiPort {
  public insertedPayloads: Array<GoogleTaskPayload> = [];
  public patchedPayloads: Array<GoogleTaskPayload> = [];

  public async listTasks(): Promise<Array<GoogleTaskResource>> {
    return [
      { due: "2026-06-03T00:00:00.000Z", id: "google-remote", status: "needsAction", title: "원격 할 일" },
    ];
  }

  public async insertTask(_taskListId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource> {
    this.insertedPayloads.push(payload);
    return { ...payload, id: "google-created" };
  }

  public async patchTask(_taskListId: string, _googleTaskId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource> {
    this.patchedPayloads.push(payload);
    return { ...payload, id: _googleTaskId };
  }
}

class FixedIdGenerator implements TodoIdGenerator {
  public nextId(): string {
    return "todo-imported";
  }
}

describe("GoogleTasksSyncAdapter", () => {
  it("uploads local todos and imports remote todos without overwriting local time", async () => {
    const api = new FakeGoogleTasksApi();
    const adapter = new GoogleTasksSyncAdapter(new FakeSettings(), api, new FixedIdGenerator(), {
      now: () => new Date("2026-06-02T09:00:00"),
    });
    const localTodo = TodoItem.create({
      date: "2026-06-02",
      id: "todo-local",
      now: new Date("2026-06-02T08:00:00"),
      time: "14:30",
      title: "로컬 할 일",
    });

    const result = await adapter.sync([localTodo]);

    expect(result.uploaded).toBe(1);
    expect(result.imported).toBe(1);
    expect(api.insertedPayloads[0]?.due).toBe("2026-06-02T00:00:00.000Z");
    expect(result.todos[0]?.snapshot()).toMatchObject({ googleTaskId: "google-created", time: "14:30" });
    expect(result.todos[1]?.snapshot()).toMatchObject({ googleTaskId: "google-remote", time: null, title: "원격 할 일" });
  });
});
