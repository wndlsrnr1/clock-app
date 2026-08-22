import chimeSoundUrl from "../../assets/CHIME14.mp3";
import { createPreferencesModule } from "../../contexts/preferences/composition";
import { createAutoStartAdapter } from "../../contexts/preferences/infrastructure/autostart/createAutoStartAdapter";
import { NeutralinoCommandExecutor } from "../../contexts/preferences/infrastructure/autostart/NeutralinoCommandExecutor";
import { PlatformEnvironmentDetector } from "../../contexts/preferences/infrastructure/autostart/PlatformEnvironmentDetector";
import { NeutralinoNotificationSoundFileAdapter } from "../../contexts/preferences/infrastructure/neutralino/NeutralinoNotificationSoundFileAdapter";
import { NeutralinoSettingsRepository } from "../../contexts/preferences/infrastructure/neutralino/NeutralinoSettingsRepository";
import { ExportPreferencesSnapshotUseCase, ReplacePreferencesSnapshotUseCase } from "../../contexts/preferences/public";
import { RunningRhythmRescheduler } from "../../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../../contexts/rhythm/application/RhythmRuntime";
import { createRhythmModule } from "../../contexts/rhythm/composition";
import { NeutralinoNotificationAdapter } from "../../contexts/rhythm/infrastructure/neutralino/NeutralinoNotificationAdapter";
import { NeutralinoSoundAdapter } from "../../contexts/rhythm/infrastructure/neutralino/NeutralinoSoundAdapter";
import { NeutralinoTrayAdapter } from "../../contexts/rhythm/infrastructure/neutralino/NeutralinoTrayAdapter";
import { DeadlineScheduler } from "../../contexts/rhythm/infrastructure/scheduler/DeadlineScheduler";
import { createTodoModule } from "../../contexts/todo/composition";
import { BrowserTodoIdGenerator } from "../../contexts/todo/infrastructure/browser/BrowserTodoIdGenerator";
import { NeutralinoTodoRepository } from "../../contexts/todo/infrastructure/neutralino/NeutralinoTodoRepository";
import { ExportTodoSnapshotsUseCase, ReplaceTodoSnapshotsUseCase } from "../../contexts/todo/public";
import { createDataTransferModule } from "../../features/data-transfer/composition";
import { NeutralinoBackupFileAdapter } from "../../features/data-transfer/infrastructure/neutralino/NeutralinoBackupFileAdapter";
import { JavaScriptClock } from "../../shared/time/JavaScriptClock";
import type { RuntimeApplication } from "../contracts/AppModules";
import { currentNeutralinoExecutablePath } from "../infrastructure/neutralino/NeutralinoRuntimeGlobals";
import { NeutralinoWindowAdapter } from "../infrastructure/neutralino/NeutralinoWindowAdapter";
import { PreferencesRhythmConfigurationReader } from "./PreferencesRhythmConfigurationReader";
import { PreferencesSoundSettingsReader } from "./PreferencesSoundSettingsReader";
import { RefreshRhythmAfterPreferencesChanged } from "./RefreshRhythmAfterPreferencesChanged";

export async function composeNeutralinoApplication(): Promise<RuntimeApplication> {
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

  await windowAdapter.keepAliveOnClose();
  await tray.updateStatus(runtime.session.status);
  await tray.registerActions({
    open: async (): Promise<void> => windowAdapter.show(),
    pause: async (): Promise<void> => {
      await rhythm.pause.execute();
    },
    resume: async (): Promise<void> => {
      await rhythm.resume.execute();
    },
    stopForToday: async (): Promise<void> => {
      await rhythm.stopForToday.execute();
    },
    quit: async (): Promise<void> => windowAdapter.quit(),
  });

  return {
    initialNow: clock.now(),
    initialPreferences: savedPreferences.snapshot(),
    modules: { dataTransfer, preferences, rhythm, todo },
  };
}
