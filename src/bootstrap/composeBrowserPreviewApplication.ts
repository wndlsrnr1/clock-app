import chimeSoundUrl from "../assets/CHIME14.mp3";
import { ExportBackupUseCase, ImportBackupUseCase, PreviewBackupImportUseCase } from "../contexts/backup/application/BackupUseCases";
import { ChangeLanguagePreferenceUseCase } from "../contexts/preferences/application/LanguagePreferenceUseCase";
import { ChooseCustomNotificationSoundUseCase, PreviewNotificationSoundUseCase, SetNotificationSoundModeUseCase, StopNotificationSoundPreviewUseCase, UpdateNotificationSoundVolumeUseCase } from "../contexts/preferences/application/NotificationSoundUseCases";
import { UpdatePreferencesUseCase } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import { UserPreferences } from "../contexts/preferences/domain/UserPreferences";
import { GetRhythmStatusUseCase } from "../contexts/rhythm/application/GetRhythmStatusUseCase";
import { PauseRhythmUseCase } from "../contexts/rhythm/application/PauseRhythmUseCase";
import type { AutoStartPort, NotificationPort, SettingsRepository, SoundPort, SystemClock, TrayPort } from "../contexts/rhythm/application/ports";
import { ResumeRhythmUseCase } from "../contexts/rhythm/application/ResumeRhythmUseCase";
import { RunningRhythmRescheduler } from "../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmRuntime } from "../contexts/rhythm/application/RhythmRuntime";
import { StartRhythmUseCase } from "../contexts/rhythm/application/StartRhythmUseCase";
import { StopRhythmForTodayUseCase } from "../contexts/rhythm/application/StopRhythmForTodayUseCase";
import type { RhythmEvent } from "../contexts/rhythm/domain/RhythmEvent";
import { AddTodoUseCase, DeleteTodoUseCase, GetTodoCalendarSummaryUseCase, GetTodosByDateUseCase, ReorderTodosUseCase, ToggleTodoUseCase, UpdateTodoUseCase } from "../contexts/todo/application/TodoUseCases";
import type { TodoRepository } from "../contexts/todo/application/ports";
import { TodoItem, type TodoItemSnapshot } from "../contexts/todo/domain/TodoItem";
import { BrowserPreviewBackupFileAdapter } from "../platform/browser/BrowserPreviewBackupFileAdapter";
import { BrowserPreviewNotificationSoundFileAdapter } from "../platform/browser/BrowserPreviewNotificationSoundFileAdapter";
import { DeadlineScheduler } from "../platform/scheduler/DeadlineScheduler";
import { BrowserTodoIdGenerator } from "../platform/todo/BrowserTodoIdGenerator";
import type { RhythmAppServices } from "../ui/RhythmAppServices";

export function composeBrowserPreviewApplication(): { services: RhythmAppServices } {
  const runtime = RhythmRuntime.empty();
  const settingsRepository = new BrowserPreviewSettingsRepository();
  runtime.replacePreferences(settingsRepository.current());

  const todoRepository = new BrowserPreviewTodoRepository();
  const todoIdGenerator = new BrowserTodoIdGenerator();
  const scheduler = new DeadlineScheduler();
  const sound = new BrowserPreviewSoundAdapter(chimeSoundUrl, settingsRepository);
  const tray = new BrowserPreviewTrayAdapter();
  const clock = new BrowserPreviewClock();
  const notification = new BrowserPreviewNotificationAdapter();
  const rhythmRescheduler = new RunningRhythmRescheduler(runtime, scheduler, notification, sound, clock);
  const autoStart = new BrowserPreviewAutoStartAdapter();
  const notificationSoundMode = new SetNotificationSoundModeUseCase(settingsRepository);
  const backupFile = new BrowserPreviewBackupFileAdapter();

  return {
    services: {
      startRhythm: new StartRhythmUseCase(runtime, settingsRepository, scheduler, sound, tray, clock, notification),
      pauseRhythm: new PauseRhythmUseCase(runtime, scheduler, tray),
      resumeRhythm: new ResumeRhythmUseCase(runtime, scheduler, tray, clock, notification, sound),
      stopForToday: new StopRhythmForTodayUseCase(runtime, scheduler, tray, clock),
      getStatus: new GetRhythmStatusUseCase(runtime),
      updatePreferences: new UpdatePreferencesUseCase(settingsRepository, autoStart, runtime, rhythmRescheduler),
      chooseCustomNotificationSound: new ChooseCustomNotificationSoundUseCase(settingsRepository, new BrowserPreviewNotificationSoundFilePort()),
      muteNotificationSound: { execute: () => notificationSoundMode.toggleMute() },
      previewNotificationSound: new PreviewNotificationSoundUseCase(sound),
      stopNotificationSoundPreview: new StopNotificationSoundPreviewUseCase(sound),
      updateNotificationSoundVolume: new UpdateNotificationSoundVolumeUseCase(settingsRepository),
      useDefaultNotificationSound: { execute: () => notificationSoundMode.useDefault() },
      addTodo: new AddTodoUseCase(todoRepository, todoIdGenerator, clock),
      deleteTodo: new DeleteTodoUseCase(todoRepository),
      getTodoCalendarSummary: new GetTodoCalendarSummaryUseCase(todoRepository),
      getTodosByDate: new GetTodosByDateUseCase(todoRepository),
      reorderTodos: new ReorderTodosUseCase(todoRepository, clock),
      toggleTodo: new ToggleTodoUseCase(todoRepository, clock),
      updateTodo: new UpdateTodoUseCase(todoRepository, clock),
      exportBackup: new ExportBackupUseCase(settingsRepository, todoRepository, backupFile, clock),
      previewImportBackup: new PreviewBackupImportUseCase(backupFile),
      importBackup: new ImportBackupUseCase(settingsRepository, todoRepository),
      changeLanguage: new ChangeLanguagePreferenceUseCase(settingsRepository, runtime),
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

class BrowserPreviewTodoRepository implements TodoRepository {
  private readonly key = "clock-rhythm-preview-todos";

  public async getAll(): Promise<Array<TodoItem>> {
    const savedText = localStorage.getItem(this.key);

    if (!savedText) {
      return [];
    }

    try {
      return (JSON.parse(savedText) as Array<TodoItemSnapshot>)
        .map((snapshot: TodoItemSnapshot): TodoItem => TodoItem.restore(snapshot));
    } catch {
      return [];
    }
  }

  public async saveAll(todos: Array<TodoItem>): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(todos.map((todo: TodoItem): TodoItemSnapshot => todo.snapshot())));
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
