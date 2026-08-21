import chimeSoundUrl from "../assets/CHIME14.mp3";
import { ExportPreferencesSnapshotUseCase, ReplacePreferencesSnapshotUseCase } from "../contexts/preferences/public";
import { ExportTodoSnapshotsUseCase, ReplaceTodoSnapshotsUseCase } from "../contexts/todo/public";
import { createDataTransferModule } from "../features/data-transfer/composition";
import { ChangeLanguagePreferenceUseCase } from "../contexts/preferences/application/LanguagePreferenceUseCase";
import { ChooseCustomNotificationSoundUseCase, PreviewNotificationSoundUseCase, SetNotificationSoundModeUseCase, StopNotificationSoundPreviewUseCase, UpdateNotificationSoundVolumeUseCase } from "../contexts/preferences/application/NotificationSoundUseCases";
import { ChangeThemePreferenceUseCase } from "../contexts/preferences/application/ThemePreferenceUseCase";
import { UpdatePreferencesUseCase } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import { GetPreferencesUseCase } from "../contexts/preferences/application/queries/GetPreferencesUseCase";
import type { AutoStartPort } from "../contexts/preferences/application/ports/AutoStartPort";
import type { SettingsRepository } from "../contexts/preferences/application/ports/SettingsRepository";
import { UserPreferences } from "../contexts/preferences/domain/UserPreferences";
import { GetRhythmStatusUseCase } from "../contexts/rhythm/application/GetRhythmStatusUseCase";
import { PauseRhythmUseCase } from "../contexts/rhythm/application/PauseRhythmUseCase";
import type { NotificationPort, SoundPort, SystemClock, TrayPort } from "../contexts/rhythm/application/ports";
import { ResumeRhythmUseCase } from "../contexts/rhythm/application/ResumeRhythmUseCase";
import { RunningRhythmRescheduler } from "../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../contexts/rhythm/application/RhythmRuntime";
import { StartRhythmUseCase } from "../contexts/rhythm/application/StartRhythmUseCase";
import { StopRhythmForTodayUseCase } from "../contexts/rhythm/application/StopRhythmForTodayUseCase";
import type { RhythmEvent } from "../contexts/rhythm/domain/RhythmEvent";
import { RhythmConfiguration } from "../contexts/rhythm/public-model";
import { createTodoModule } from "../contexts/todo/composition";
import { BrowserTodoIdGenerator } from "../contexts/todo/infrastructure/browser/BrowserTodoIdGenerator";
import { BrowserTodoRepository } from "../contexts/todo/infrastructure/browser/BrowserTodoRepository";
import { BrowserBackupFileAdapter } from "../features/data-transfer/infrastructure/browser/BrowserBackupFileAdapter";
import { BrowserPreviewNotificationSoundFileAdapter } from "../platform/browser/BrowserPreviewNotificationSoundFileAdapter";
import { DeadlineScheduler } from "../platform/scheduler/DeadlineScheduler";
import type { RhythmAppServices } from "../ui/RhythmAppServices";
import { RefreshRhythmAfterPreferencesChanged } from "../app/composition/RefreshRhythmAfterPreferencesChanged";
import { PreferencesRhythmConfigurationReader } from "../app/composition/PreferencesRhythmConfigurationReader";
import type { UserPreferencesSnapshot } from "../contexts/preferences/domain/UserPreferences";

export function composeBrowserPreviewApplication(): { initialPreferences: UserPreferencesSnapshot; services: RhythmAppServices } {
  const runtime = RhythmRuntime.empty();
  const settingsRepository = new BrowserPreviewSettingsRepository();
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
  const sound = new BrowserPreviewSoundAdapter(chimeSoundUrl, settingsRepository);
  const tray = new BrowserPreviewTrayAdapter();
  const clock = new BrowserPreviewClock();
  const notification = new BrowserPreviewNotificationAdapter();
  const rhythmRescheduler = new RunningRhythmRescheduler(runtime, scheduler, notification, sound, clock);
  const preferencesChanged = new RefreshRhythmAfterPreferencesChanged(runtime, rhythmRescheduler);
  const autoStart = new BrowserPreviewAutoStartAdapter();
  const notificationSoundMode = new SetNotificationSoundModeUseCase(settingsRepository);
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

  return {
    initialPreferences: currentPreferences.snapshot(),
    services: {
      startRhythm: new StartRhythmUseCase(runtime, configurationReader, scheduler, sound, tray, clock, notification),
      pauseRhythm: new PauseRhythmUseCase(runtime, scheduler, tray),
      resumeRhythm: new ResumeRhythmUseCase(runtime, scheduler, tray, clock, notification, sound),
      stopForToday: new StopRhythmForTodayUseCase(runtime, scheduler, tray, clock),
      getStatus: new GetRhythmStatusUseCase(runtime),
      updatePreferences: new UpdatePreferencesUseCase(settingsRepository, autoStart, preferencesChanged),
      getPreferences: new GetPreferencesUseCase(settingsRepository),
      chooseCustomNotificationSound: new ChooseCustomNotificationSoundUseCase(settingsRepository, new BrowserPreviewNotificationSoundFilePort()),
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
    },
  };
}

class BrowserPreviewSettingsRepository implements SettingsRepository {
  private readonly key = "clock-rhythm-preview-preferences";

  public current(): UserPreferences {
    return this.readSavedPreferences();
  }

  public async get(): Promise<UserPreferences> {
    return this.readSavedPreferences();
  }

  public async save(preferences: UserPreferences): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify({
      autoStartEnabled: preferences.autoStart.enabled,
      dailyEnd: preferences.dailyRhythm.end.toText(),
      dailyStart: preferences.dailyRhythm.start.toText(),
      focusMinutes: preferences.focusMinutes.value,
      initialSetupCompleted: preferences.initialSetupCompleted,
      language: preferences.language,
      notificationSound: preferences.notificationSound,
      restMinutes: preferences.restMinutes.value,
      theme: preferences.theme,
    }));
  }

  private readSavedPreferences(): UserPreferences {
    const savedText = localStorage.getItem(this.key);

    if (!savedText) {
      return UserPreferences.default();
    }

    try {
      return UserPreferences.restore(JSON.parse(savedText) as {
        autoStartEnabled: boolean;
        dailyEnd: string;
        dailyStart: string;
        focusMinutes: number;
        initialSetupCompleted?: boolean;
        language?: UserPreferences["language"];
        notificationSound?: UserPreferences["notificationSound"];
        restMinutes: number;
        theme?: UserPreferences["theme"];
      });
    } catch {
      return UserPreferences.default();
    }
  }
}

class BrowserPreviewNotificationAdapter implements NotificationPort {
  public async notify(event: RhythmEvent): Promise<void> {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = event.kind === "focusEnds" ? "휴식 시간입니다" : "다시 집중할 시간입니다";
    new Notification(title);
  }
}

class BrowserPreviewSoundAdapter implements SoundPort {
  private audio: HTMLAudioElement | null = null;
  private currentSource: string | null = null;

  public constructor(
    private readonly defaultSource: string,
    private readonly settingsRepository: SettingsRepository,
  ) {}

  public async prepare(): Promise<void> {
    const audio = await this.currentAudio();

    if (!audio) {
      return;
    }

    const previousVolume = audio.volume;
    audio.volume = 0;

    try {
      await audio.play();
    } catch {
      return;
    } finally {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = previousVolume;
    }
  }

  public async play(): Promise<void> {
    const audio = await this.currentAudio();

    if (!audio) {
      return;
    }

    audio.volume = (await this.settingsRepository.get()).notificationSound.volume;
    audio.currentTime = 0;
    await audio.play();
  }

  public async stop(): Promise<void> {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
  }

  private async currentAudio(): Promise<HTMLAudioElement | null> {
    const sound = (await this.settingsRepository.get()).notificationSound;
    const source = sound.mode === "custom" ? sound.customSource : this.defaultSource;

    if (sound.mode === "muted" || !source) {
      return null;
    }

    if (this.audio && this.currentSource === source) {
      return this.audio;
    }

    this.audio = new Audio(source);
    this.audio.preload = "auto";
    this.currentSource = source;

    return this.audio;
  }
}

class BrowserPreviewTrayAdapter implements TrayPort {
  public async updateStatus(): Promise<void> {}
}

class BrowserPreviewClock implements SystemClock {
  public now(): Date {
    return new Date();
  }
}

class BrowserPreviewNotificationSoundFilePort extends BrowserPreviewNotificationSoundFileAdapter {}

class BrowserPreviewAutoStartAdapter implements AutoStartPort {
  public async enable(): Promise<void> {}

  public async disable(): Promise<void> {}

  public async isEnabled(): Promise<boolean> {
    return false;
  }
}
