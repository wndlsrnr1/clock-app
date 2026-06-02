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
}

export class GoogleTasksSyncAdapter implements TodoSyncPort {
  public constructor(
    private readonly settings: GoogleTasksSettingsPort,
    private readonly api: GoogleTasksApiPort,
    private readonly idGenerator: TodoIdGenerator,
    private readonly clock: TodoClock,
  ) {}

  public async sync(todos: Array<TodoItem>): Promise<TodoSyncResult> {
    const taskListId = await this.settings.getTaskListId();

    if (!taskListId) {
      throw new Error("Google Tasks 목록을 먼저 선택해주세요.");
    }

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
      imported: importedTodos.length,
      todos: [...uploadedTodos, ...importedTodos],
      updated,
      uploaded,
    };
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
