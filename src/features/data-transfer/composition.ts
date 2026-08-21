import type { UserPreferencesSnapshot } from "../../contexts/preferences/public";
import type { TodoItemSnapshot } from "../../contexts/todo/public";
import {
  ExportBackupUseCase,
  ImportBackupUseCase,
  PreviewBackupImportUseCase,
} from "./application/BackupUseCases";
import type { BackupClock, BackupFilePort, PreferencesBackupPort, TodoBackupPort } from "./application/ports";
import type { DataTransferModule } from "./public";

export interface DataTransferModuleDependencies {
  exportPreferences: { execute(): Promise<UserPreferencesSnapshot> };
  replacePreferences: { execute(snapshot: UserPreferencesSnapshot): Promise<void> };
  exportTodos: { execute(): Promise<Array<TodoItemSnapshot>> };
  replaceTodos: { execute(snapshots: Array<TodoItemSnapshot>): Promise<void> };
  backupFile: BackupFilePort;
  clock: BackupClock;
}

export function createDataTransferModule(dependencies: DataTransferModuleDependencies): DataTransferModule {
  const preferences: PreferencesBackupPort = {
    exportSnapshot: (): Promise<UserPreferencesSnapshot> => dependencies.exportPreferences.execute(),
    replaceSnapshot: (snapshot: UserPreferencesSnapshot): Promise<void> => dependencies.replacePreferences.execute(snapshot),
  };
  const todos: TodoBackupPort = {
    exportSnapshots: (): Promise<Array<TodoItemSnapshot>> => dependencies.exportTodos.execute(),
    replaceSnapshots: (snapshots: Array<TodoItemSnapshot>): Promise<void> => dependencies.replaceTodos.execute(snapshots),
  };

  return {
    exportBackup: new ExportBackupUseCase(preferences, todos, dependencies.backupFile, dependencies.clock),
    importBackup: new ImportBackupUseCase(preferences, todos),
    previewImport: new PreviewBackupImportUseCase(dependencies.backupFile),
  };
}
