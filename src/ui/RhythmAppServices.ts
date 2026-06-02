import type { RhythmStatusSnapshot } from "../contexts/rhythm/application/RhythmStatusSnapshot";
import type { UpdatePreferencesCommand } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import type { LanguagePreference, ThemePreference, UserPreferences } from "../contexts/preferences/domain/UserPreferences";
import type { PreparedBackupImport } from "../contexts/backup/application/BackupUseCases";
import type { AddTodoCommand, ReorderTodosCommand, UpdateTodoCommand } from "../contexts/todo/application/TodoUseCases";
import type { TodoDaySummary } from "../contexts/todo/domain/TodoList";
import type { TodoItemSnapshot } from "../contexts/todo/domain/TodoItem";

export interface AsyncStatusUseCase {
  execute(): Promise<RhythmStatusSnapshot>;
}

export interface SyncStatusUseCase {
  execute(): RhythmStatusSnapshot;
}

export interface UpdatePreferencesService {
  execute(command: UpdatePreferencesCommand): Promise<UserPreferences>;
}

export interface PreferenceResultUseCase {
  execute(): Promise<UserPreferences>;
}

export interface VoidUseCase {
  execute(): Promise<void>;
}

export interface PreviewImportBackupService {
  execute(): Promise<PreparedBackupImport | null>;
}

export interface ImportBackupService {
  execute(preparedImport: PreparedBackupImport): Promise<void>;
}

export interface NotificationSoundVolumeService {
  execute(volume: number): Promise<UserPreferences>;
}

export interface ChangeLanguageService {
  execute(language: LanguagePreference): Promise<UserPreferences>;
}

export interface ChangeThemeService {
  execute(theme: ThemePreference): Promise<UserPreferences>;
}

export interface AddTodoService {
  execute(command: AddTodoCommand): Promise<TodoItemSnapshot>;
}

export interface UpdateTodoService {
  execute(command: UpdateTodoCommand): Promise<TodoItemSnapshot>;
}

export interface TodoIdService {
  execute(id: string): Promise<TodoItemSnapshot | void>;
}

export interface GetTodosByDateService {
  execute(date: string): Promise<Array<TodoItemSnapshot>>;
}

export interface ReorderTodosService {
  execute(command: ReorderTodosCommand): Promise<Array<TodoItemSnapshot>>;
}

export interface GetTodoCalendarSummaryService {
  execute(month: string): Promise<Record<string, TodoDaySummary>>;
}

export interface RhythmAppServices {
  startRhythm: AsyncStatusUseCase;
  pauseRhythm: AsyncStatusUseCase;
  resumeRhythm: AsyncStatusUseCase;
  stopForToday: AsyncStatusUseCase;
  getStatus: SyncStatusUseCase;
  updatePreferences: UpdatePreferencesService;
  chooseCustomNotificationSound: PreferenceResultUseCase;
  muteNotificationSound: PreferenceResultUseCase;
  previewNotificationSound: VoidUseCase;
  stopNotificationSoundPreview: VoidUseCase;
  updateNotificationSoundVolume: NotificationSoundVolumeService;
  useDefaultNotificationSound: PreferenceResultUseCase;
  addTodo: AddTodoService;
  deleteTodo: TodoIdService;
  getTodoCalendarSummary: GetTodoCalendarSummaryService;
  getTodosByDate: GetTodosByDateService;
  reorderTodos: ReorderTodosService;
  toggleTodo: TodoIdService;
  updateTodo: UpdateTodoService;
  exportBackup: VoidUseCase;
  previewImportBackup: PreviewImportBackupService;
  importBackup: ImportBackupService;
  changeLanguage: ChangeLanguageService;
  changeTheme: ChangeThemeService;
}
