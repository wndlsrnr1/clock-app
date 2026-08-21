import chimeSoundUrl from "../assets/CHIME14.mp3";
import { ExportPreferencesSnapshotUseCase, ReplacePreferencesSnapshotUseCase } from "../contexts/preferences/public";
import { ExportTodoSnapshotsUseCase, ReplaceTodoSnapshotsUseCase } from "../contexts/todo/public";
import { createDataTransferModule } from "../features/data-transfer/composition";
import { createPreferencesModule } from "../contexts/preferences/composition";
import type { UserPreferencesSnapshot } from "../contexts/preferences/domain/UserPreferences";
import { createRhythmModule } from "../contexts/rhythm/composition";
import { RunningRhythmRescheduler } from "../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../contexts/rhythm/application/RhythmRuntime";
import { NeutralinoNotificationAdapter } from "../contexts/rhythm/infrastructure/neutralino/NeutralinoNotificationAdapter";
import { NeutralinoSoundAdapter } from "../contexts/rhythm/infrastructure/neutralino/NeutralinoSoundAdapter";
import { NeutralinoTrayAdapter } from "../contexts/rhythm/infrastructure/neutralino/NeutralinoTrayAdapter";
import { DeadlineScheduler } from "../contexts/rhythm/infrastructure/scheduler/DeadlineScheduler";
import { createTodoModule } from "../contexts/todo/composition";
import { NeutralinoTodoRepository } from "../contexts/todo/infrastructure/neutralino/NeutralinoTodoRepository";
import { BrowserTodoIdGenerator } from "../contexts/todo/infrastructure/browser/BrowserTodoIdGenerator";
import { createAutoStartAdapter } from "../contexts/preferences/infrastructure/autostart/createAutoStartAdapter";
import { NeutralinoCommandExecutor } from "../contexts/preferences/infrastructure/autostart/NeutralinoCommandExecutor";
import { PlatformEnvironmentDetector } from "../contexts/preferences/infrastructure/autostart/PlatformEnvironmentDetector";
import { NeutralinoNotificationSoundFileAdapter } from "../contexts/preferences/infrastructure/neutralino/NeutralinoNotificationSoundFileAdapter";
import { NeutralinoSettingsRepository } from "../contexts/preferences/infrastructure/neutralino/NeutralinoSettingsRepository";
import { NeutralinoBackupFileAdapter } from "../features/data-transfer/infrastructure/neutralino/NeutralinoBackupFileAdapter";
import { currentNeutralinoExecutablePath } from "../platform/neutralino/NeutralinoRuntimeGlobals";
import { JavaScriptClock } from "../shared/time/JavaScriptClock";
import { NeutralinoWindowAdapter } from "../platform/neutralino/NeutralinoWindowAdapter";
import type { RhythmAppServices } from "../ui/RhythmAppServices";
import { RefreshRhythmAfterPreferencesChanged } from "../app/composition/RefreshRhythmAfterPreferencesChanged";
import { PreferencesRhythmConfigurationReader } from "../app/composition/PreferencesRhythmConfigurationReader";
import { PreferencesSoundSettingsReader } from "../app/composition/PreferencesSoundSettingsReader";

export interface ComposedApplication {
  services: RhythmAppServices;
  initialPreferences: UserPreferencesSnapshot;
}

export async function composeApplication(): Promise<ComposedApplication> {
  const runtime = RhythmRuntime.empty();
  const settingsRepository = new NeutralinoSettingsRepository();
  const savedPreferences = await settingsRepository.get();
  const configurationReader = new PreferencesRhythmConfigurationReader(settingsRepository);
  runtime.replaceConfiguration(await configurationReader.get());

  const todoRepository = new NeutralinoTodoRepository();
  const todoIdGenerator = new BrowserTodoIdGenerator();
  const scheduler = new DeadlineScheduler();
  const sound = new NeutralinoSoundAdapter(chimeSoundUrl, new PreferencesSoundSettingsReader(settingsRepository));
  const tray = new NeutralinoTrayAdapter("/dist/icon.png");
  const clock = new JavaScriptClock();
  const notification = new NeutralinoNotificationAdapter();
  const rhythmRescheduler = new RunningRhythmRescheduler(runtime, scheduler, notification, sound, clock);
  const preferencesChanged = new RefreshRhythmAfterPreferencesChanged(runtime, rhythmRescheduler);
  const windowAdapter = new NeutralinoWindowAdapter();
  const notificationSoundFiles = new NeutralinoNotificationSoundFileAdapter();
  if (savedPreferences.notificationSound.mode === "custom" && savedPreferences.notificationSound.customSource === "/user-sounds/notification.mp3") {
    await notificationSoundFiles.restoreCustomSoundMount();
  }
  const backupFile = new NeutralinoBackupFileAdapter();
  const autoStart = createAutoStartAdapter(
    await new PlatformEnvironmentDetector().detect(),
    new NeutralinoCommandExecutor(),
    {
      appName: "Clock Rhythm",
      executablePath: currentNeutralinoExecutablePath(),
    },
  );
  const preferences = createPreferencesModule(
    settingsRepository,
    autoStart,
    notificationSoundFiles,
    sound,
    preferencesChanged,
  );
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

  const services: RhythmAppServices = {
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
  };

  await windowAdapter.keepAliveOnClose();
  await tray.updateStatus(runtime.session.status);
  await tray.registerActions({
    open: async (): Promise<void> => windowAdapter.show(),
    pause: async (): Promise<void> => {
      await services.pauseRhythm.execute();
    },
    resume: async (): Promise<void> => {
      await services.resumeRhythm.execute();
    },
    stopForToday: async (): Promise<void> => {
      await services.stopForToday.execute();
    },
    quit: async (): Promise<void> => windowAdapter.quit(),
  });

  return { initialPreferences: savedPreferences.snapshot(), services };
}
