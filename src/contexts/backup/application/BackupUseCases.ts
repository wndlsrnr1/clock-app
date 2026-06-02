import type { SettingsRepository } from "../../rhythm/application/ports";
import type { TodoRepository } from "../../todo/application/ports";
import { TodoItem, type TodoItemSnapshot } from "../../todo/domain/TodoItem";
import { UserPreferences, type UserPreferencesSnapshot } from "../../preferences/domain/UserPreferences";
import type { BackupClock, BackupFilePort } from "./ports";

const BACKUP_APP_NAME = "Clock Rhythm";
const BACKUP_SCHEMA_VERSION = 1;

interface ClockRhythmBackup {
  appName: typeof BACKUP_APP_NAME;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  preferences: UserPreferencesSnapshot;
  todos: Array<TodoItemSnapshot>;
}

export class ExportBackupUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly todoRepository: TodoRepository,
    private readonly backupFile: BackupFilePort,
    private readonly clock: BackupClock,
  ) {}

  public async execute(): Promise<void> {
    const backup: ClockRhythmBackup = {
      appName: BACKUP_APP_NAME,
      exportedAt: this.clock.now().toISOString(),
      preferences: (await this.settingsRepository.get()).snapshot(),
      schemaVersion: BACKUP_SCHEMA_VERSION,
      todos: (await this.todoRepository.getAll()).map((todo: TodoItem): TodoItemSnapshot => todo.snapshot()),
    };

    await this.backupFile.saveBackup(JSON.stringify(backup, null, 2));
  }
}

export class ImportBackupUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly todoRepository: TodoRepository,
    private readonly backupFile: BackupFilePort,
  ) {}

  public async execute(): Promise<void> {
    const backupText = await this.backupFile.readBackup();

    if (backupText === null) {
      return;
    }

    const backup = parseBackup(backupText);
    const preferences = UserPreferences.restore(sanitizePreferencesForImport(backup.preferences));
    const todos = backup.todos.map((todo: TodoItemSnapshot): TodoItem => TodoItem.restore(todo));

    await this.settingsRepository.save(preferences);
    await this.todoRepository.saveAll(todos);
  }
}

function parseBackup(backupText: string): ClockRhythmBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(backupText);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }

  if (!isBackupEnvelope(parsed)) {
    throw new Error("Backup schema version is not supported.");
  }

  if (!isPreferencesSnapshot(parsed.preferences) || !Array.isArray(parsed.todos)) {
    throw new Error("Backup file is missing required data.");
  }

  return parsed;
}

function isBackupEnvelope(value: unknown): value is ClockRhythmBackup {
  if (!isRecord(value)) {
    return false;
  }

  return value.appName === BACKUP_APP_NAME
    && value.schemaVersion === BACKUP_SCHEMA_VERSION
    && typeof value.exportedAt === "string";
}

function isPreferencesSnapshot(value: unknown): value is UserPreferencesSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return Number.isInteger(value.focusMinutes)
    && Number.isInteger(value.restMinutes)
    && typeof value.dailyStart === "string"
    && typeof value.dailyEnd === "string"
    && typeof value.autoStartEnabled === "boolean";
}

function sanitizePreferencesForImport(preferences: UserPreferencesSnapshot): UserPreferencesSnapshot {
  if (preferences.notificationSound?.mode !== "custom") {
    return preferences;
  }

  return {
    ...preferences,
    notificationSound: {
      customFileName: null,
      customSource: null,
      mode: "default",
      mutedFrom: null,
      volume: preferences.notificationSound.volume,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
