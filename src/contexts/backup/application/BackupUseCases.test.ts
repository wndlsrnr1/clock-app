import { describe, expect, it } from "vitest";
import type { SettingsRepository } from "../../rhythm/application/ports";
import type { TodoRepository } from "../../todo/application/ports";
import { TodoItem } from "../../todo/domain/TodoItem";
import { UserPreferences } from "../../preferences/domain/UserPreferences";
import { ExportBackupUseCase, ImportBackupUseCase } from "./BackupUseCases";
import type { BackupFilePort } from "./ports";

class InMemorySettingsRepository implements SettingsRepository {
  public constructor(private preferences: UserPreferences = UserPreferences.default()) {}

  public async get(): Promise<UserPreferences> {
    return this.preferences;
  }

  public async save(preferences: UserPreferences): Promise<void> {
    this.preferences = preferences;
  }
}

class InMemoryTodoRepository implements TodoRepository {
  public constructor(private todos: Array<TodoItem> = []) {}

  public async getAll(): Promise<Array<TodoItem>> {
    return this.todos;
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    this.todos = todos;
  }
}

class InMemoryBackupFilePort implements BackupFilePort {
  public savedText = "";
  public textToRead = "";

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
    const importBackup = new ImportBackupUseCase(
      new InMemorySettingsRepository(),
      new InMemoryTodoRepository(),
      files,
    );

    files.textToRead = "{";
    await expect(importBackup.execute()).rejects.toThrow("Backup file is not valid JSON.");

    files.textToRead = JSON.stringify({ schemaVersion: 2 });
    await expect(importBackup.execute()).rejects.toThrow("Backup schema version is not supported.");
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

    await expect(new ImportBackupUseCase(settings, todos, files).execute()).rejects.toThrow();

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

    await new ImportBackupUseCase(settings, todos, files).execute();

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
});
