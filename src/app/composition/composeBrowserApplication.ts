import chimeSoundUrl from "../../assets/CHIME14.mp3";
import { createPreferencesModule } from "../../contexts/preferences/composition";
import { BrowserAutoStartAdapter } from "../../contexts/preferences/infrastructure/browser/BrowserAutoStartAdapter";
import { BrowserNotificationSoundFileAdapter } from "../../contexts/preferences/infrastructure/browser/BrowserNotificationSoundFileAdapter";
import { BrowserPreferencesRepository } from "../../contexts/preferences/infrastructure/browser/BrowserPreferencesRepository";
import { ExportPreferencesSnapshotUseCase, ReplacePreferencesSnapshotUseCase } from "../../contexts/preferences/public";
import { RunningRhythmRescheduler } from "../../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../../contexts/rhythm/application/RhythmRuntime";
import { createRhythmModule } from "../../contexts/rhythm/composition";
import { BrowserNotificationAdapter } from "../../contexts/rhythm/infrastructure/browser/BrowserNotificationAdapter";
import { BrowserSoundAdapter } from "../../contexts/rhythm/infrastructure/browser/BrowserSoundAdapter";
import { BrowserTrayAdapter } from "../../contexts/rhythm/infrastructure/browser/BrowserTrayAdapter";
import { DeadlineScheduler } from "../../contexts/rhythm/infrastructure/scheduler/DeadlineScheduler";
import { RhythmConfiguration } from "../../contexts/rhythm/public-model";
import { createTodoModule } from "../../contexts/todo/composition";
import { BrowserTodoIdGenerator } from "../../contexts/todo/infrastructure/browser/BrowserTodoIdGenerator";
import { BrowserTodoRepository } from "../../contexts/todo/infrastructure/browser/BrowserTodoRepository";
import { ExportTodoSnapshotsUseCase, ReplaceTodoSnapshotsUseCase } from "../../contexts/todo/public";
import { createDataTransferModule } from "../../features/data-transfer/composition";
import { BrowserBackupFileAdapter } from "../../features/data-transfer/infrastructure/browser/BrowserBackupFileAdapter";
import { JavaScriptClock } from "../../shared/time/JavaScriptClock";
import type { RuntimeApplication } from "../contracts/AppModules";
import { PreferencesRhythmConfigurationReader } from "./PreferencesRhythmConfigurationReader";
import { PreferencesSoundSettingsReader } from "./PreferencesSoundSettingsReader";
import { RefreshRhythmAfterPreferencesChanged } from "./RefreshRhythmAfterPreferencesChanged";

export function composeBrowserApplication(): RuntimeApplication {
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
  const clock = new JavaScriptClock();
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
    initialNow: clock.now(),
    initialPreferences: currentPreferences.snapshot(),
    modules: { dataTransfer, preferences, rhythm, todo },
  };
}

