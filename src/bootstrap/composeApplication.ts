import chimeSoundUrl from "../assets/CHIME14.mp3";
import { ExportPreferencesSnapshotUseCase, ReplacePreferencesSnapshotUseCase } from "../contexts/preferences/public";
import { ExportTodoSnapshotsUseCase, ReplaceTodoSnapshotsUseCase } from "../contexts/todo/public";
import { createDataTransferModule } from "../features/data-transfer/composition";
import { ChangeLanguagePreferenceUseCase } from "../contexts/preferences/application/LanguagePreferenceUseCase";
import { ChooseCustomNotificationSoundUseCase, PreviewNotificationSoundUseCase, SetNotificationSoundModeUseCase, StopNotificationSoundPreviewUseCase, UpdateNotificationSoundVolumeUseCase } from "../contexts/preferences/application/NotificationSoundUseCases";
import { ChangeThemePreferenceUseCase } from "../contexts/preferences/application/ThemePreferenceUseCase";
import { UpdatePreferencesUseCase } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import { GetPreferencesUseCase } from "../contexts/preferences/application/queries/GetPreferencesUseCase";
import type { UserPreferencesSnapshot } from "../contexts/preferences/domain/UserPreferences";
import { GetRhythmStatusUseCase } from "../contexts/rhythm/application/GetRhythmStatusUseCase";
import { PauseRhythmUseCase } from "../contexts/rhythm/application/PauseRhythmUseCase";
import { ResumeRhythmUseCase } from "../contexts/rhythm/application/ResumeRhythmUseCase";
import { RunningRhythmRescheduler } from "../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../contexts/rhythm/application/RhythmRuntime";
import { StartRhythmUseCase } from "../contexts/rhythm/application/StartRhythmUseCase";
import { StopRhythmForTodayUseCase } from "../contexts/rhythm/application/StopRhythmForTodayUseCase";
import { createTodoModule } from "../contexts/todo/composition";
import { NeutralinoTodoRepository } from "../contexts/todo/infrastructure/neutralino/NeutralinoTodoRepository";
import { BrowserTodoIdGenerator } from "../contexts/todo/infrastructure/browser/BrowserTodoIdGenerator";
import { createAutoStartAdapter } from "../platform/autostart/createAutoStartAdapter";
import { PlatformEnvironmentDetector } from "../platform/environment/PlatformEnvironmentDetector";
import { NeutralinoBackupFileAdapter } from "../features/data-transfer/infrastructure/neutralino/NeutralinoBackupFileAdapter";
import { NeutralinoCommandExecutor } from "../platform/neutralino/NeutralinoCommandExecutor";
import { NeutralinoNotificationSoundFileAdapter } from "../platform/neutralino/NeutralinoNotificationSoundFileAdapter";
import { NeutralinoNotificationAdapter } from "../platform/neutralino/NeutralinoNotificationAdapter";
import { currentNeutralinoExecutablePath } from "../platform/neutralino/NeutralinoRuntimeGlobals";
import { NeutralinoSettingsRepository } from "../platform/neutralino/NeutralinoSettingsRepository";
import { NeutralinoSoundAdapter } from "../platform/neutralino/NeutralinoSoundAdapter";
import { NeutralinoSystemClock } from "../platform/neutralino/NeutralinoSystemClock";
import { NeutralinoTrayAdapter } from "../platform/neutralino/NeutralinoTrayAdapter";
import { NeutralinoWindowAdapter } from "../platform/neutralino/NeutralinoWindowAdapter";
import { DeadlineScheduler } from "../platform/scheduler/DeadlineScheduler";
import type { RhythmAppServices } from "../ui/RhythmAppServices";
import { RefreshRhythmAfterPreferencesChanged } from "../app/composition/RefreshRhythmAfterPreferencesChanged";
import { PreferencesRhythmConfigurationReader } from "../app/composition/PreferencesRhythmConfigurationReader";

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
  const sound = new NeutralinoSoundAdapter(chimeSoundUrl, settingsRepository);
  const tray = new NeutralinoTrayAdapter("/dist/icon.png");
  const clock = new NeutralinoSystemClock();
  const notification = new NeutralinoNotificationAdapter();
  const rhythmRescheduler = new RunningRhythmRescheduler(runtime, scheduler, notification, sound, clock);
  const preferencesChanged = new RefreshRhythmAfterPreferencesChanged(runtime, rhythmRescheduler);
  const windowAdapter = new NeutralinoWindowAdapter();
  const notificationSoundFiles = new NeutralinoNotificationSoundFileAdapter();
  if (savedPreferences.notificationSound.mode === "custom" && savedPreferences.notificationSound.customSource === "/user-sounds/notification.mp3") {
    await notificationSoundFiles.restoreCustomSoundMount();
  }
  const notificationSoundMode = new SetNotificationSoundModeUseCase(settingsRepository);
  const backupFile = new NeutralinoBackupFileAdapter();
  const autoStart = createAutoStartAdapter(
    await new PlatformEnvironmentDetector().detect(),
    new NeutralinoCommandExecutor(),
    {
      appName: "Clock Rhythm",
      executablePath: currentNeutralinoExecutablePath(),
    },
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

  const services: RhythmAppServices = {
    startRhythm: new StartRhythmUseCase(runtime, configurationReader, scheduler, sound, tray, clock, notification),
    pauseRhythm: new PauseRhythmUseCase(runtime, scheduler, tray),
    resumeRhythm: new ResumeRhythmUseCase(runtime, scheduler, tray, clock, notification, sound),
    stopForToday: new StopRhythmForTodayUseCase(runtime, scheduler, tray, clock),
    getStatus: new GetRhythmStatusUseCase(runtime),
    updatePreferences: new UpdatePreferencesUseCase(settingsRepository, autoStart, preferencesChanged),
    getPreferences: new GetPreferencesUseCase(settingsRepository),
    chooseCustomNotificationSound: new ChooseCustomNotificationSoundUseCase(settingsRepository, notificationSoundFiles),
    muteNotificationSound: { execute: () => notificationSoundMode.toggleMute() },
    previewNotificationSound: new PreviewNotificationSoundUseCase(sound),
    stopNotificationSoundPreview: new StopNotificationSoundPreviewUseCase(sound),
    updateNotificationSoundVolume: new UpdateNotificationSoundVolumeUseCase(settingsRepository),
    useDefaultNotificationSound: { execute: () => notificationSoundMode.useDefault() },
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
    changeLanguage: new ChangeLanguagePreferenceUseCase(settingsRepository),
    changeTheme: new ChangeThemePreferenceUseCase(settingsRepository),
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
