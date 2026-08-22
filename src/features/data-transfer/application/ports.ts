export interface BackupFilePort {
  saveBackup(text: string): Promise<void>;
  readBackup(): Promise<string | null>;
}

import type { UserPreferencesSnapshot } from "../../../contexts/preferences/public";
import type { TodoItemSnapshot } from "../../../contexts/todo/public";

export interface PreferencesBackupPort {
  exportSnapshot(): Promise<UserPreferencesSnapshot>;
  replaceSnapshot(snapshot: UserPreferencesSnapshot): Promise<void>;
}

export interface TodoBackupPort {
  exportSnapshots(): Promise<Array<TodoItemSnapshot>>;
  replaceSnapshots(snapshots: Array<TodoItemSnapshot>): Promise<void>;
}
