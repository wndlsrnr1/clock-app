import chimeSoundUrl from "../assets/CHIME14.mp3";
import { ChangeLanguagePreferenceUseCase } from "../contexts/preferences/application/LanguagePreferenceUseCase";
import { ChooseCustomNotificationSoundUseCase, PreviewNotificationSoundUseCase, SetNotificationSoundModeUseCase, StopNotificationSoundPreviewUseCase, UpdateNotificationSoundVolumeUseCase } from "../contexts/preferences/application/NotificationSoundUseCases";
import { UpdatePreferencesUseCase } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import { GetRhythmStatusUseCase } from "../contexts/rhythm/application/GetRhythmStatusUseCase";
import { PauseRhythmUseCase } from "../contexts/rhythm/application/PauseRhythmUseCase";
import { ResumeRhythmUseCase } from "../contexts/rhythm/application/ResumeRhythmUseCase";
import { RunningRhythmRescheduler } from "../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../contexts/rhythm/application/RhythmRuntime";
import { StartRhythmUseCase } from "../contexts/rhythm/application/StartRhythmUseCase";
import { StopRhythmForTodayUseCase } from "../contexts/rhythm/application/StopRhythmForTodayUseCase";
import { SyncGoogleTodosUseCase } from "../contexts/todo/application/SyncGoogleTodosUseCase";
import { AddTodoUseCase, DeleteTodoUseCase, GetTodoCalendarSummaryUseCase, GetTodosByDateUseCase, ReorderTodosUseCase, ToggleTodoUseCase, UpdateTodoUseCase } from "../contexts/todo/application/TodoUseCases";
import { createAutoStartAdapter } from "../platform/autostart/createAutoStartAdapter";
import { PlatformEnvironmentDetector } from "../platform/environment/PlatformEnvironmentDetector";
import { GoogleTasksApiAdapter } from "../platform/google/GoogleTasksApiAdapter";
import { GoogleTasksAuthAdapter } from "../platform/google/GoogleTasksAuthAdapter";
import { GoogleTasksCredentialRepository } from "../platform/google/GoogleTasksCredentialRepository";
import { GoogleTasksPendingDeletionRepository } from "../platform/google/GoogleTasksPendingDeletionRepository";
import { GoogleTasksSettingsRepository } from "../platform/google/GoogleTasksSettingsRepository";
import { GoogleTasksSyncAdapter } from "../platform/google/GoogleTasksSyncAdapter";
import { NeutralinoCommandExecutor } from "../platform/neutralino/NeutralinoCommandExecutor";
import { NeutralinoNotificationSoundFileAdapter } from "../platform/neutralino/NeutralinoNotificationSoundFileAdapter";
import { NeutralinoNotificationAdapter } from "../platform/neutralino/NeutralinoNotificationAdapter";
import { currentNeutralinoExecutablePath } from "../platform/neutralino/NeutralinoRuntimeGlobals";
import { NeutralinoSettingsRepository } from "../platform/neutralino/NeutralinoSettingsRepository";
import { NeutralinoSoundAdapter } from "../platform/neutralino/NeutralinoSoundAdapter";
import { NeutralinoSystemClock } from "../platform/neutralino/NeutralinoSystemClock";
import { NeutralinoTodoRepository } from "../platform/neutralino/NeutralinoTodoRepository";
import { NeutralinoTrayAdapter } from "../platform/neutralino/NeutralinoTrayAdapter";
import { NeutralinoWindowAdapter } from "../platform/neutralino/NeutralinoWindowAdapter";
import { DeadlineScheduler } from "../platform/scheduler/DeadlineScheduler";
import { BrowserTodoIdGenerator } from "../platform/todo/BrowserTodoIdGenerator";
import type { RhythmAppServices } from "../ui/RhythmAppServices";

export interface ComposedApplication {
  services: RhythmAppServices;
}

export async function composeApplication(): Promise<ComposedApplication> {
  const runtime = RhythmRuntime.empty();
  const settingsRepository = new NeutralinoSettingsRepository();
  const savedPreferences = await settingsRepository.get();
  runtime.replacePreferences(savedPreferences);

  const todoRepository = new NeutralinoTodoRepository();
  const todoIdGenerator = new BrowserTodoIdGenerator();
  const scheduler = new DeadlineScheduler();
  const sound = new NeutralinoSoundAdapter(chimeSoundUrl, settingsRepository);
  const tray = new NeutralinoTrayAdapter("/dist/icon.png");
  const clock = new NeutralinoSystemClock();
  const notification = new NeutralinoNotificationAdapter();
  const rhythmRescheduler = new RunningRhythmRescheduler(runtime, scheduler, notification, sound, clock);
  const windowAdapter = new NeutralinoWindowAdapter();
  const notificationSoundFiles = new NeutralinoNotificationSoundFileAdapter();
  if (savedPreferences.notificationSound.mode === "custom" && savedPreferences.notificationSound.customSource === "/user-sounds/notification.mp3") {
    await notificationSoundFiles.restoreCustomSoundMount();
  }
  const notificationSoundMode = new SetNotificationSoundModeUseCase(settingsRepository);
  const googleSettings = new GoogleTasksSettingsRepository();
  const googleCredentials = new GoogleTasksCredentialRepository();
  const googleAuth = new GoogleTasksAuthAdapter(googleSettings, googleCredentials);
  const googleApi = new GoogleTasksApiAdapter(googleSettings, googleCredentials);
  const googlePendingDeletions = new GoogleTasksPendingDeletionRepository(googleSettings, clock);
  const googleSync = new GoogleTasksSyncAdapter(googleSettings, googleApi, todoIdGenerator, clock, googlePendingDeletions);
  const autoStart = createAutoStartAdapter(
    await new PlatformEnvironmentDetector().detect(),
    new NeutralinoCommandExecutor(),
    {
      appName: "Clock Rhythm",
      executablePath: currentNeutralinoExecutablePath(),
    },
  );

  const services: RhythmAppServices = {
    startRhythm: new StartRhythmUseCase(runtime, settingsRepository, scheduler, sound, tray, clock, notification),
    pauseRhythm: new PauseRhythmUseCase(runtime, scheduler, tray),
    resumeRhythm: new ResumeRhythmUseCase(runtime, scheduler, tray, clock, notification, sound),
    stopForToday: new StopRhythmForTodayUseCase(runtime, scheduler, tray, clock),
    getStatus: new GetRhythmStatusUseCase(runtime),
    updatePreferences: new UpdatePreferencesUseCase(settingsRepository, autoStart, runtime, rhythmRescheduler),
    chooseCustomNotificationSound: new ChooseCustomNotificationSoundUseCase(settingsRepository, notificationSoundFiles),
    muteNotificationSound: { execute: () => notificationSoundMode.toggleMute() },
    previewNotificationSound: new PreviewNotificationSoundUseCase(sound),
    stopNotificationSoundPreview: new StopNotificationSoundPreviewUseCase(sound),
    updateNotificationSoundVolume: new UpdateNotificationSoundVolumeUseCase(settingsRepository),
    useDefaultNotificationSound: { execute: () => notificationSoundMode.useDefault() },
    addTodo: new AddTodoUseCase(todoRepository, todoIdGenerator, clock),
    deleteTodo: new DeleteTodoUseCase(todoRepository, googlePendingDeletions),
    getTodoCalendarSummary: new GetTodoCalendarSummaryUseCase(todoRepository),
    getTodosByDate: new GetTodosByDateUseCase(todoRepository),
    reorderTodos: new ReorderTodosUseCase(todoRepository, clock),
    toggleTodo: new ToggleTodoUseCase(todoRepository, clock),
    updateTodo: new UpdateTodoUseCase(todoRepository, clock),
    beginGoogleAuthorization: { execute: (): Promise<string> => googleAuth.beginAuthorization() },
    completeGoogleAuthorization: { execute: (codeOrUrl: string) => googleAuth.completeAuthorization(codeOrUrl) },
    listGoogleTaskLists: { execute: () => googleApi.listTaskLists() },
    saveGoogleOAuthClient: { execute: (client) => googleSettings.saveOAuthClient(client) },
    selectGoogleTaskList: { execute: (taskListId: string) => googleSettings.selectTaskList(taskListId) },
    syncGoogleTodos: new SyncGoogleTodosUseCase(todoRepository, googleSync),
    changeLanguage: new ChangeLanguagePreferenceUseCase(settingsRepository, runtime),
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

  return { services };
}
