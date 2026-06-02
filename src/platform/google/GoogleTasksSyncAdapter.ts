import type { TodoClock, TodoIdGenerator, TodoSyncPort, TodoSyncResult } from "../../contexts/todo/application/ports";
import type { TodoItem } from "../../contexts/todo/domain/TodoItem";
import { GoogleTasksMapper, type GoogleTaskPayload, type GoogleTaskResource } from "./GoogleTasksMapper";

export interface GoogleTasksSettingsPort {
  getTaskListId(): Promise<string | null>;
}

export interface GoogleTasksApiPort {
  listTasks(taskListId: string): Promise<Array<GoogleTaskResource>>;
  insertTask(taskListId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource>;
  patchTask(taskListId: string, googleTaskId: string, payload: GoogleTaskPayload): Promise<GoogleTaskResource>;
  deleteTask(taskListId: string, googleTaskId: string): Promise<void>;
}

export interface GoogleTasksPendingDeletion {
  taskListId: string;
  googleTaskId: string;
  deletedAt: string;
}

export interface GoogleTasksPendingDeletionPort {
  listPendingDeletions(taskListId: string): Promise<Array<GoogleTasksPendingDeletion>>;
  removePendingDeletion(taskListId: string, googleTaskId: string): Promise<void>;
}

export class GoogleTasksSyncAdapter implements TodoSyncPort {
  public constructor(
    private readonly settings: GoogleTasksSettingsPort,
    private readonly api: GoogleTasksApiPort,
    private readonly idGenerator: TodoIdGenerator,
    private readonly clock: TodoClock,
    private readonly pendingDeletions: GoogleTasksPendingDeletionPort = new EmptyGoogleTasksPendingDeletionPort(),
  ) {}

  public async sync(todos: Array<TodoItem>): Promise<TodoSyncResult> {
    const taskListId = await this.settings.getTaskListId();

    if (!taskListId) {
      throw new Error("Google Tasks 목록을 먼저 선택해주세요.");
    }

    const deleted = await this.deletePendingTasks(taskListId);
    const remoteTasks = await this.api.listTasks(taskListId);
    const uploadedTodos: Array<TodoItem> = [];
    let uploaded = 0;
    let updated = 0;

    for (const todo of todos) {
      const snapshot = todo.snapshot();
      const payload = GoogleTasksMapper.toGoogleTaskPayload(todo);

      if (snapshot.googleTaskId) {
        await this.api.patchTask(taskListId, snapshot.googleTaskId, payload);
        uploadedTodos.push(todo);
        updated += 1;
        continue;
      }

      const createdTask = await this.api.insertTask(taskListId, payload);
      uploadedTodos.push(todo.connectGoogleTask(createdTask.id, this.clock.now()));
      uploaded += 1;
    }

    const localGoogleTaskIds = new Set(uploadedTodos.map((todo: TodoItem): string | null => todo.snapshot().googleTaskId));
    const importedTodos: Array<TodoItem> = [];

    for (const task of remoteTasks.filter((task: GoogleTaskResource): boolean => !localGoogleTaskIds.has(task.id))) {
      const now = this.clock.now();
      const dueDate = GoogleTasksMapper.localDueDate(task, now);
      importedTodos.push(GoogleTasksMapper.fromGoogleTask(task, {
        displayOrder: GoogleTasksSyncAdapter.nextDisplayOrderForDate([...uploadedTodos, ...importedTodos], dueDate),
        id: this.idGenerator.nextId(),
        now,
      }));
    }

    return {
      deleted,
      imported: importedTodos.length,
      todos: [...uploadedTodos, ...importedTodos],
      updated,
      uploaded,
    };
  }

  private async deletePendingTasks(taskListId: string): Promise<number> {
    const pendingDeletions = await this.pendingDeletions.listPendingDeletions(taskListId);
    let deleted = 0;

    for (const deletion of pendingDeletions) {
      await this.api.deleteTask(deletion.taskListId, deletion.googleTaskId);
      await this.pendingDeletions.removePendingDeletion(deletion.taskListId, deletion.googleTaskId);
      deleted += 1;
    }

    return deleted;
  }

  private static nextDisplayOrderForDate(todos: Array<TodoItem>, date: string): number {
    const displayOrders = todos
      .filter((todo: TodoItem): boolean => todo.todoDate === date)
      .map((todo: TodoItem): number => todo.todoDisplayOrder);

    if (displayOrders.length === 0) {
      return 0;
    }

    return Math.max(...displayOrders) + 1;
  }
}

class EmptyGoogleTasksPendingDeletionPort implements GoogleTasksPendingDeletionPort {
  public async listPendingDeletions(): Promise<Array<GoogleTasksPendingDeletion>> {
    return [];
  }

  public async removePendingDeletion(): Promise<void> {}
}
