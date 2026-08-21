import type { TodoItemSnapshot } from "../../../contexts/todo/public";
import type { UserPreferencesSnapshot } from "../../../contexts/preferences/public";
import type { Clock } from "../../../shared/time/Clock";
import type { BackupFilePort, PreferencesBackupPort, TodoBackupPort } from "./ports";

const BACKUP_APP_NAME = "Clock Rhythm";
const BACKUP_SCHEMA_VERSION = 1;

interface ClockRhythmBackup {
  appName: typeof BACKUP_APP_NAME;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  preferences: UserPreferencesSnapshot;
  todos: Array<TodoItemSnapshot>;
}

export interface BackupImportSummary {
  exportedAt: string;
  focusMinutes: number;
  language: UserPreferencesSnapshot["language"];
  restMinutes: number;
  todoCount: number;
}

export interface PreparedBackupImport {
  backupText: string;
  summary: BackupImportSummary;
}

export class ExportBackupUseCase {
  public constructor(
    private readonly preferences: PreferencesBackupPort,
    private readonly todos: TodoBackupPort,
    private readonly backupFile: BackupFilePort,
    private readonly clock: Clock,
  ) {}

  public async execute(): Promise<void> {
    const backup: ClockRhythmBackup = {
      appName: BACKUP_APP_NAME,
      exportedAt: this.clock.now().toISOString(),
      preferences: await this.preferences.exportSnapshot(),
      schemaVersion: BACKUP_SCHEMA_VERSION,
      todos: await this.todos.exportSnapshots(),
    };

    await this.backupFile.saveBackup(JSON.stringify(backup, null, 2));
  }
}

export class ImportBackupUseCase {
  public constructor(
    private readonly preferences: PreferencesBackupPort,
    private readonly todos: TodoBackupPort,
  ) {}

  public async execute(preparedImport: PreparedBackupImport): Promise<void> {
    const backup = parseBackup(preparedImport.backupText);
    await this.todos.replaceSnapshots(backup.todos);
    await this.preferences.replaceSnapshot(sanitizePreferencesForImport(backup.preferences));
  }
}

export class PreviewBackupImportUseCase {
  public constructor(private readonly backupFile: BackupFilePort) {}

  public async execute(): Promise<PreparedBackupImport | null> {
    const backupText = await this.backupFile.readBackup();

    if (backupText === null) {
      return null;
    }

    const backup = parseBackup(backupText);

    return {
      backupText,
      summary: {
        exportedAt: backup.exportedAt,
        focusMinutes: backup.preferences.focusMinutes,
        language: backup.preferences.language ?? "kor",
        restMinutes: backup.preferences.restMinutes,
        todoCount: backup.todos.length,
      },
    };
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
