import { describe, expect, it } from "vitest";
import { UserPreferences, type UserPreferencesSnapshot } from "../../../contexts/preferences/public";
import { TodoItem, type TodoItemSnapshot } from "../../../contexts/todo/public";
import { ExportBackupUseCase, ImportBackupUseCase, PreviewBackupImportUseCase, type PreparedBackupImport } from "./BackupUseCases";
import type { BackupFilePort, PreferencesBackupPort, TodoBackupPort } from "./ports";

class InMemorySettingsRepository implements PreferencesBackupPort {
  public constructor(private preferences: UserPreferences = UserPreferences.default()) {}

  public async get(): Promise<UserPreferences> {
    return this.preferences;
  }

  public async save(preferences: UserPreferences): Promise<void> {
    this.preferences = preferences;
  }

  public async exportSnapshot(): Promise<UserPreferencesSnapshot> {
    return this.preferences.snapshot();
  }

  public async replaceSnapshot(snapshot: UserPreferencesSnapshot): Promise<void> {
    this.preferences = UserPreferences.restore(snapshot);
  }
}

class InMemoryTodoRepository implements TodoBackupPort {
  public constructor(private todos: Array<TodoItem> = []) {}

  public async getAll(): Promise<Array<TodoItem>> {
    return this.todos;
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    this.todos = todos;
  }

  public async exportSnapshots(): Promise<Array<TodoItemSnapshot>> {
    return this.todos.map((todo): TodoItemSnapshot => todo.snapshot());
  }

  public async replaceSnapshots(snapshots: Array<TodoItemSnapshot>): Promise<void> {
    this.todos = snapshots.map((snapshot): TodoItem => TodoItem.restore(snapshot));
  }
}

class InMemoryBackupFilePort implements BackupFilePort {
  public savedText = "";
  public textToRead: string | null = "";

  public async saveBackup(text: string): Promise<void> {
    this.savedText = text;
  }

  public async readBackup(): Promise<string | null> {
    return this.textToRead;
  }
}

describe("backup use cases", () => {
  it("exports preferences and todos with schema version 1", async () => {
    const settings = new InMemorySettingsRepository(
      UserPreferences.default().changeTerms(45, 15).changeLanguage("en"),
    );
    const todos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-02",
        displayOrder: 0,
        id: "todo-1",
        now: new Date("2026-06-02T09:00:00.000Z"),
        time: "14:30",
        title: "운동",
      }),
    ]);
    const files = new InMemoryBackupFilePort();

    await new ExportBackupUseCase(settings, todos, files, {
      now: () => new Date("2026-06-02T10:00:00.000Z"),
    }).execute();

    expect(JSON.parse(files.savedText)).toMatchObject({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      preferences: {
        focusMinutes: 45,
        language: "en",
        restMinutes: 15,
      },
      todos: [
        {
          date: "2026-06-02",
          id: "todo-1",
          time: "14:30",
          title: "운동",
        },
      ],
    });
    expect(files.savedText).not.toContain("googleTaskId");
  });

  it("rejects invalid JSON and unsupported schema versions", async () => {
    const files = new InMemoryBackupFilePort();
    const previewImport = new PreviewBackupImportUseCase(files);

    files.textToRead = "{";
    await expect(previewImport.execute()).rejects.toThrow("Backup file is not valid JSON.");

    files.textToRead = JSON.stringify({ schemaVersion: 2 });
    await expect(previewImport.execute()).rejects.toThrow("Backup schema version is not supported.");
  });

  it("keeps current data when the user cancels the import file picker", async () => {
    const settings = new InMemorySettingsRepository(UserPreferences.default().changeTerms(45, 15));
    const todos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-02",
        id: "todo-before-cancel",
        now: new Date("2026-06-02T09:00:00.000Z"),
        title: "취소 전 할 일",
      }),
    ]);
    const files = new InMemoryBackupFilePort();
    files.textToRead = null;

    await expect(new PreviewBackupImportUseCase(files).execute()).resolves.toBeNull();

    expect((await settings.get()).focusMinutes.value).toBe(45);
    expect((await todos.getAll()).map((todo: TodoItem): string => todo.snapshot().id)).toEqual(["todo-before-cancel"]);
  });

  it("imports an empty todo list as a full replacement", async () => {
    const settings = new InMemorySettingsRepository();
    const todos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-02",
        id: "todo-to-remove",
        now: new Date("2026-06-02T09:00:00.000Z"),
        title: "삭제될 할 일",
      }),
    ]);
    const files = new InMemoryBackupFilePort();
    files.textToRead = JSON.stringify({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      preferences: {
        autoStartEnabled: false,
        dailyEnd: "18:00",
        dailyStart: "05:00",
        focusMinutes: 45,
        restMinutes: 15,
      },
      todos: [],
    });

    const preparedImport = await preparedImportFrom(files);
    await new ImportBackupUseCase(settings, todos).execute(preparedImport);

    expect((await settings.get()).focusMinutes.value).toBe(45);
    expect(await todos.getAll()).toEqual([]);
  });

  it("rejects backups missing preferences or todos without replacing data", async () => {
    const settings = new InMemorySettingsRepository(UserPreferences.default().changeTerms(50, 10));
    const todos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-02",
        id: "existing-todo",
        now: new Date("2026-06-02T09:00:00.000Z"),
        title: "기존 할 일",
      }),
    ]);
    const files = new InMemoryBackupFilePort();
    const previewImport = new PreviewBackupImportUseCase(files);

    files.textToRead = JSON.stringify({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      todos: [],
    });
    await expect(previewImport.execute()).rejects.toThrow("Backup file is missing required data.");

    files.textToRead = JSON.stringify({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      preferences: {
        autoStartEnabled: false,
        dailyEnd: "18:00",
        dailyStart: "05:00",
        focusMinutes: 45,
        restMinutes: 15,
      },
    });
    await expect(previewImport.execute()).rejects.toThrow("Backup file is missing required data.");

    expect((await settings.get()).focusMinutes.value).toBe(50);
    expect((await todos.getAll()).map((todo: TodoItem): string => todo.snapshot().id)).toEqual(["existing-todo"]);
  });

  it("does not partially replace data when todo restoration fails", async () => {
    const settings = new InMemorySettingsRepository(UserPreferences.default().changeTerms(50, 10));
    const todos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-01",
        id: "old-todo",
        now: new Date("2026-06-01T09:00:00.000Z"),
        title: "기존 할 일",
      }),
    ]);
    const files = new InMemoryBackupFilePort();
    files.textToRead = JSON.stringify({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      preferences: {
        autoStartEnabled: true,
        dailyEnd: "21:00",
        dailyStart: "07:00",
        focusMinutes: 40,
        restMinutes: 12,
      },
      todos: [
        {
          completed: false,
          createdAt: "2026-06-02T09:00:00.000Z",
          date: "2026-06-02",
          displayOrder: 0,
          id: "broken-todo",
          time: null,
          title: "",
          updatedAt: "2026-06-02T09:00:00.000Z",
        },
      ],
    });

    const preparedImport = await preparedImportFrom(files);

    await expect(new ImportBackupUseCase(settings, todos).execute(preparedImport)).rejects.toThrow();

    expect((await settings.get()).focusMinutes.value).toBe(50);
    expect((await todos.getAll())[0]?.snapshot().id).toBe("old-todo");
  });

  it("replaces current preferences and todos on import", async () => {
    const settings = new InMemorySettingsRepository();
    const todos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-01",
        id: "old-todo",
        now: new Date("2026-06-01T09:00:00.000Z"),
        title: "교체될 일",
      }),
    ]);
    const files = new InMemoryBackupFilePort();
    files.textToRead = JSON.stringify({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      preferences: {
        autoStartEnabled: true,
        dailyEnd: "21:00",
        dailyStart: "07:00",
        focusMinutes: 40,
        language: "en",
        notificationSound: {
          customFileName: "bell.mp3",
          customSource: "/user-sounds/notification.mp3",
          mode: "custom",
          mutedFrom: null,
          volume: 0.5,
        },
        restMinutes: 12,
      },
      todos: [
        {
          completed: false,
          createdAt: "2026-06-02T09:00:00.000Z",
          date: "2026-06-02",
          displayOrder: 0,
          googleTaskId: "legacy-google-id",
          id: "todo-1",
          time: null,
          title: "복원된 일",
          updatedAt: "2026-06-02T09:00:00.000Z",
        },
      ],
    });

    const preparedImport = await preparedImportFrom(files);
    await new ImportBackupUseCase(settings, todos).execute(preparedImport);

    const restoredPreferences = await settings.get();
    const restoredTodos = await todos.getAll();
    expect(restoredPreferences.focusMinutes.value).toBe(40);
    expect(restoredPreferences.notificationSound.mode).toBe("default");
    expect(restoredTodos).toHaveLength(1);
    expect(restoredTodos[0]?.snapshot()).toMatchObject({
      id: "todo-1",
      title: "복원된 일",
    });
    expect(JSON.stringify(restoredTodos[0]?.snapshot())).not.toContain("legacy-google-id");
  });

  it("round-trips exported data as a full replacement backup", async () => {
    const exportSettings = new InMemorySettingsRepository(
      UserPreferences.default().changeTerms(45, 15).changeLanguage("en"),
    );
    const exportTodos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-02",
        displayOrder: 0,
        id: "todo-time",
        now: new Date("2026-06-02T09:00:00.000Z"),
        time: "14:30",
        title: "시간 있는 할 일",
      }),
      TodoItem.create({
        date: "2026-06-02",
        displayOrder: 1,
        id: "todo-done",
        now: new Date("2026-06-02T09:10:00.000Z"),
        title: "완료될 할 일",
      }).complete(new Date("2026-06-02T09:20:00.000Z")),
    ]);
    const files = new InMemoryBackupFilePort();

    await new ExportBackupUseCase(exportSettings, exportTodos, files, {
      now: () => new Date("2026-06-02T10:00:00.000Z"),
    }).execute();

    const importSettings = new InMemorySettingsRepository(UserPreferences.default().changeTerms(20, 5));
    const importTodos = new InMemoryTodoRepository([
      TodoItem.create({
        date: "2026-06-03",
        id: "mutated-todo",
        now: new Date("2026-06-03T09:00:00.000Z"),
        title: "교체되어야 할 일",
      }),
    ]);
    files.textToRead = files.savedText;

    const preparedImport = await preparedImportFrom(files);
    await new ImportBackupUseCase(importSettings, importTodos).execute(preparedImport);

    const importedPreferences = await importSettings.get();
    const importedTodos = (await importTodos.getAll()).map((todo: TodoItem): TodoItemSnapshot => todo.snapshot());
    expect(importedPreferences.focusMinutes.value).toBe(45);
    expect(importedPreferences.restMinutes.value).toBe(15);
    expect(importedPreferences.language).toBe("en");
    expect(importedTodos).toHaveLength(2);
    expect(importedTodos.map((todo: TodoItemSnapshot): string => todo.id)).toEqual(["todo-time", "todo-done"]);
    expect(importedTodos[0]).toMatchObject({ time: "14:30", title: "시간 있는 할 일" });
    expect(importedTodos[1]).toMatchObject({ completed: true, title: "완료될 할 일" });
  });

  it("previews backup summary before replacing local data", async () => {
    const files = new InMemoryBackupFilePort();
    files.textToRead = JSON.stringify({
      appName: "Clock Rhythm",
      exportedAt: "2026-06-02T10:00:00.000Z",
      schemaVersion: 1,
      preferences: {
        autoStartEnabled: false,
        dailyEnd: "18:00",
        dailyStart: "05:00",
        focusMinutes: 45,
        language: "en",
        restMinutes: 15,
      },
      todos: [
        todoSnapshot({ id: "todo-1", title: "첫 번째" }),
        todoSnapshot({ id: "todo-2", title: "두 번째" }),
      ],
    });

    await expect(new PreviewBackupImportUseCase(files).execute()).resolves.toMatchObject({
      summary: {
        exportedAt: "2026-06-02T10:00:00.000Z",
        focusMinutes: 45,
        language: "en",
        restMinutes: 15,
        todoCount: 2,
      },
    });
  });
});

async function preparedImportFrom(files: InMemoryBackupFilePort): Promise<PreparedBackupImport> {
  const preparedImport = await new PreviewBackupImportUseCase(files).execute();

  if (!preparedImport) {
    throw new Error("Expected prepared import.");
  }

  return preparedImport;
}

function todoSnapshot(overrides: Partial<TodoItemSnapshot>): TodoItemSnapshot {
  return {
    completed: false,
    createdAt: "2026-06-02T09:00:00.000Z",
    date: "2026-06-02",
    displayOrder: 0,
    id: "todo-1",
    time: null,
    title: "Todo",
    updatedAt: "2026-06-02T09:00:00.000Z",
    ...overrides,
  };
}
