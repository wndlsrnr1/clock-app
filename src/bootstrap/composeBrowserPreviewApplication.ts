import chimeSoundUrl from "../assets/CHIME14.mp3";
import { ExportPreferencesSnapshotUseCase, ReplacePreferencesSnapshotUseCase } from "../contexts/preferences/public";
import { ExportTodoSnapshotsUseCase, ReplaceTodoSnapshotsUseCase } from "../contexts/todo/public";
import { createDataTransferModule } from "../features/data-transfer/composition";
import { createPreferencesModule } from "../contexts/preferences/composition";
import { BrowserAutoStartAdapter } from "../contexts/preferences/infrastructure/browser/BrowserAutoStartAdapter";
import { BrowserNotificationSoundFileAdapter } from "../contexts/preferences/infrastructure/browser/BrowserNotificationSoundFileAdapter";
import { BrowserPreferencesRepository } from "../contexts/preferences/infrastructure/browser/BrowserPreferencesRepository";
import type { SystemClock } from "../contexts/rhythm/application/ports";
import { RunningRhythmRescheduler } from "../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../contexts/rhythm/application/RhythmRuntime";
import { createRhythmModule } from "../contexts/rhythm/composition";
import { BrowserNotificationAdapter } from "../contexts/rhythm/infrastructure/browser/BrowserNotificationAdapter";
import { BrowserSoundAdapter } from "../contexts/rhythm/infrastructure/browser/BrowserSoundAdapter";
import { BrowserTrayAdapter } from "../contexts/rhythm/infrastructure/browser/BrowserTrayAdapter";
import { DeadlineScheduler } from "../contexts/rhythm/infrastructure/scheduler/DeadlineScheduler";
import { RhythmConfiguration } from "../contexts/rhythm/public-model";
import { createTodoModule } from "../contexts/todo/composition";
import { BrowserTodoIdGenerator } from "../contexts/todo/infrastructure/browser/BrowserTodoIdGenerator";
import { BrowserTodoRepository } from "../contexts/todo/infrastructure/browser/BrowserTodoRepository";
import { BrowserBackupFileAdapter } from "../features/data-transfer/infrastructure/browser/BrowserBackupFileAdapter";
import type { RhythmAppServices } from "../ui/RhythmAppServices";
import { RefreshRhythmAfterPreferencesChanged } from "../app/composition/RefreshRhythmAfterPreferencesChanged";
import { PreferencesRhythmConfigurationReader } from "../app/composition/PreferencesRhythmConfigurationReader";
import { PreferencesSoundSettingsReader } from "../app/composition/PreferencesSoundSettingsReader";
import type { UserPreferencesSnapshot } from "../contexts/preferences/domain/UserPreferences";

export function composeBrowserPreviewApplication(): { initialPreferences: UserPreferencesSnapshot; services: RhythmAppServices } {
  const runtime = RhythmRuntime.empty();
  const settingsRepository = new BrowserPreferencesRepository();
  const currentPreferences = settingsRepository.current();
  const configurationReader = new PreferencesRhythmConfigurationReader(settingsRepository);
  runtime.replaceConfiguration(RhythmConfiguration.create({
    dailyRhythm: currentPreferences.dailyRhythm,
    focusTerm: currentPreferences.focusMinutes,
    restTerm: currentPreferences.restMinutes,
  }));

  const todoRepository = new BrowserTodoRepository();
  const todoIdGenerator = new BrowserTodoIdGenerator();
  const scheduler = new DeadlineScheduler();
  const sound = new BrowserSoundAdapter(chimeSoundUrl, new PreferencesSoundSettingsReader(settingsRepository));
  const tray = new BrowserTrayAdapter();
  const clock = new BrowserPreviewClock();
  const notification = new BrowserNotificationAdapter();
  const rhythmRescheduler = new RunningRhythmRescheduler(runtime, scheduler, notification, sound, clock);
  const preferencesChanged = new RefreshRhythmAfterPreferencesChanged(runtime, rhythmRescheduler);
  const autoStart = new BrowserAutoStartAdapter();
  const preferences = createPreferencesModule(
    settingsRepository,
    autoStart,
    new BrowserNotificationSoundFileAdapter(),
    sound,
    preferencesChanged,
  );
  const backupFile = new BrowserBackupFileAdapter();
  const dataTransfer = createDataTransferModule({
    backupFile,
    clock,
    exportPreferences: new ExportPreferencesSnapshotUseCase(settingsRepository),
    exportTodos: new ExportTodoSnapshotsUseCase(todoRepository),
    replacePreferences: new ReplacePreferencesSnapshotUseCase(settingsRepository, preferencesChanged),
    replaceTodos: new ReplaceTodoSnapshotsUseCase(todoRepository),
  });
  const todo = createTodoModule(todoRepository, todoIdGenerator, clock);
  const rhythm = createRhythmModule(runtime, configurationReader, scheduler, sound, tray, clock, notification);

  return {
    initialPreferences: currentPreferences.snapshot(),
    services: {
      startRhythm: rhythm.start,
      pauseRhythm: rhythm.pause,
      resumeRhythm: rhythm.resume,
      stopForToday: rhythm.stopForToday,
      getStatus: rhythm.getStatus,
      updatePreferences: preferences.update,
      getPreferences: preferences.get,
      chooseCustomNotificationSound: preferences.chooseCustomNotificationSound,
      muteNotificationSound: preferences.muteNotificationSound,
      previewNotificationSound: preferences.previewNotificationSound,
      stopNotificationSoundPreview: preferences.stopNotificationSoundPreview,
      updateNotificationSoundVolume: preferences.updateNotificationSoundVolume,
      useDefaultNotificationSound: preferences.useDefaultNotificationSound,
      addTodo: todo.add,
      deleteTodo: todo.delete,
      getTodoCalendarSummary: todo.getCalendarSummary,
      getTodosByDate: todo.getByDate,
      reorderTodos: todo.reorder,
      toggleTodo: todo.toggle,
      updateTodo: todo.update,
      exportBackup: dataTransfer.exportBackup,
      previewImportBackup: dataTransfer.previewImport,
      importBackup: dataTransfer.importBackup,
      changeLanguage: preferences.changeLanguage,
      changeTheme: preferences.changeTheme,
    },
  };
}

class BrowserPreviewClock implements SystemClock {
  public now(): Date {
    return new Date();
  }
}

