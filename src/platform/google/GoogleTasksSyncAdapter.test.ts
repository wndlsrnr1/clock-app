import { describe, expect, it } from "vitest";
import type { TodoIdGenerator } from "../../contexts/todo/application/ports";
import { TodoItem } from "../../contexts/todo/domain/TodoItem";
import { GoogleTasksSyncAdapter, type GoogleTasksApiPort, type GoogleTasksPendingDeletion, type GoogleTasksPendingDeletionPort, type GoogleTasksSettingsPort } from "./GoogleTasksSyncAdapter";
import type { GoogleTaskPayload, GoogleTaskResource } from "./GoogleTasksMapper";

class FakeSettings implements GoogleTasksSettingsPort {
  public async getTaskListId(): Promise<string | null> {
    return "task-list-1";
  }
}

class FakeGoogleTasksApi implements GoogleTasksApiPort {
  public insertedPayloads: Array<GoogleTaskPayload> = [];
  public patchedPayloads: Array<GoogleTaskPayload> = [];
  public deletedTaskIds: Array<string> = [];
  public shouldFailDelete = false;

  public async listTasks(): Promise<Array<GoogleTaskResource>> {
    const tasks: Array<GoogleTaskResource> = [
      { due: "2026-06-02T00:00:00.000Z", id: "google-remote", status: "needsAction", title: "원격 할 일" },
    ];

    return tasks.filter((task: GoogleTaskResource): boolean => !this.deletedTaskIds.includes(task.id));
  }

  public async insertTask(_taskListId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource> {
    this.insertedPayloads.push(payload);
    return { ...payload, id: "google-created" };
  }

  public async patchTask(_taskListId: string, _googleTaskId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource> {
    this.patchedPayloads.push(payload);
    return { ...payload, id: _googleTaskId };
  }

  public async deleteTask(_taskListId: string, googleTaskId: string): Promise<void> {
    if (this.shouldFailDelete) {
      throw new Error("delete failed");
    }

    this.deletedTaskIds.push(googleTaskId);
  }
}

class FakePendingDeletionRepository implements GoogleTasksPendingDeletionPort {
  public constructor(public deletions: Array<GoogleTasksPendingDeletion> = []) {}

  public async listPendingDeletions(taskListId: string): Promise<Array<GoogleTasksPendingDeletion>> {
    return this.deletions.filter((deletion: GoogleTasksPendingDeletion): boolean => deletion.taskListId === taskListId);
  }

  public async removePendingDeletion(taskListId: string, googleTaskId: string): Promise<void> {
    this.deletions = this.deletions.filter((deletion: GoogleTasksPendingDeletion): boolean => (
      deletion.taskListId !== taskListId || deletion.googleTaskId !== googleTaskId
    ));
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
    const pendingDeletions = new FakePendingDeletionRepository();
    const adapter = new GoogleTasksSyncAdapter(new FakeSettings(), api, new FixedIdGenerator(), {
      now: () => new Date("2026-06-02T09:00:00"),
    }, pendingDeletions);
    const localTodo = TodoItem.create({
      date: "2026-06-02",
      displayOrder: 2,
      id: "todo-local",
      now: new Date("2026-06-02T08:00:00"),
      time: "14:30",
      title: "로컬 할 일",
    });

    const result = await adapter.sync([localTodo]);

    expect(result.uploaded).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.deleted).toBe(0);
    expect(api.insertedPayloads[0]?.due).toBe("2026-06-02T00:00:00.000Z");
    expect(result.todos[0]?.snapshot()).toMatchObject({ displayOrder: 2, googleTaskId: "google-created", time: "14:30" });
    expect(result.todos[1]?.snapshot()).toMatchObject({ displayOrder: 3, googleTaskId: "google-remote", time: null, title: "원격 할 일" });
  });

  it("deletes pending Google tasks before importing remote tasks", async () => {
    const api = new FakeGoogleTasksApi();
    const pendingDeletions = new FakePendingDeletionRepository([
      { deletedAt: "2026-06-02T09:00:00.000Z", googleTaskId: "google-remote", taskListId: "task-list-1" },
    ]);
    const adapter = new GoogleTasksSyncAdapter(new FakeSettings(), api, new FixedIdGenerator(), {
      now: () => new Date("2026-06-02T09:00:00"),
    }, pendingDeletions);

    const result = await adapter.sync([]);

    expect(api.deletedTaskIds).toEqual(["google-remote"]);
    expect(pendingDeletions.deletions).toEqual([]);
    expect(result.deleted).toBe(1);
    expect(result.imported).toBe(0);
  });

  it("keeps pending deletions and stops sync when Google deletion fails", async () => {
    const api = new FakeGoogleTasksApi();
    api.shouldFailDelete = true;
    const pendingDeletions = new FakePendingDeletionRepository([
      { deletedAt: "2026-06-02T09:00:00.000Z", googleTaskId: "google-remote", taskListId: "task-list-1" },
    ]);
    const adapter = new GoogleTasksSyncAdapter(new FakeSettings(), api, new FixedIdGenerator(), {
      now: () => new Date("2026-06-02T09:00:00"),
    }, pendingDeletions);

    await expect(adapter.sync([])).rejects.toThrow("delete failed");

    expect(pendingDeletions.deletions).toHaveLength(1);
  });
});
