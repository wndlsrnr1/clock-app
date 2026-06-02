import { ClockTime } from "../../rhythm/domain/ClockTime";
import { DailyRhythm } from "../../rhythm/domain/DailyRhythm";
import { DurationMinutes } from "../../rhythm/domain/DurationMinutes";

export interface AutoStartPreference {
  enabled: boolean;
}

export type LanguagePreference = "kor" | "en";
export type NotificationSoundMode = "default" | "custom" | "muted";
export type AudibleNotificationSoundMode = Exclude<NotificationSoundMode, "muted">;

export interface AudibleNotificationSoundPreference {
  mode: AudibleNotificationSoundMode;
  customFileName: string | null;
  customSource: string | null;
}

export interface NotificationSoundPreference {
  mode: NotificationSoundMode;
  customFileName: string | null;
  customSource: string | null;
  volume: number;
  mutedFrom: AudibleNotificationSoundPreference | null;
}

export class UserPreferences {
  private constructor(
    public readonly focusMinutes: DurationMinutes,
    public readonly restMinutes: DurationMinutes,
    public readonly dailyRhythm: DailyRhythm,
    public readonly autoStart: AutoStartPreference,
    public readonly notificationSound: NotificationSoundPreference,
    public readonly language: LanguagePreference,
  ) {}

  public static default(): UserPreferences {
    return new UserPreferences(
      DurationMinutes.create(50),
      DurationMinutes.create(10),
      DailyRhythm.default(),
      { enabled: false },
      UserPreferences.defaultNotificationSound(),
      "kor",
    );
  }

  public static restore(properties: {
    focusMinutes: number;
    restMinutes: number;
    dailyStart: string;
    dailyEnd: string;
    autoStartEnabled: boolean;
    notificationSound?: Partial<NotificationSoundPreference>;
    language?: string;
  }): UserPreferences {
    return new UserPreferences(
      UserPreferences.createFocusTerm(properties.focusMinutes),
      UserPreferences.createRestTerm(properties.restMinutes),
      DailyRhythm.create({
        start: ClockTime.fromText(properties.dailyStart),
        end: ClockTime.fromText(properties.dailyEnd),
      }),
      { enabled: properties.autoStartEnabled },
      UserPreferences.restoreNotificationSound(properties.notificationSound),
      UserPreferences.restoreLanguage(properties.language),
    );
  }

  public changeTerms(focusMinutes: number, restMinutes: number): UserPreferences {
    return new UserPreferences(
      UserPreferences.createFocusTerm(focusMinutes),
      UserPreferences.createRestTerm(restMinutes),
      this.dailyRhythm,
      this.autoStart,
      this.notificationSound,
      this.language,
    );
  }

  public changeDailyRhythm(start: string, end: string): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      DailyRhythm.create({
        start: ClockTime.fromText(start),
        end: ClockTime.fromText(end),
      }),
      this.autoStart,
      this.notificationSound,
      this.language,
    );
  }

  public changeAutoStart(enabled: boolean): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      { enabled },
      this.notificationSound,
      this.language,
    );
  }

  public useDefaultNotificationSound(): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      UserPreferences.defaultNotificationSound(this.notificationSound.volume),
      this.language,
    );
  }

  public toggleNotificationSoundMute(): UserPreferences {
    if (this.notificationSound.mode === "muted") {
      return this.restoreAudibleNotificationSound();
    }

    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      {
        customFileName: null,
        customSource: null,
        mode: "muted",
        mutedFrom: UserPreferences.snapshotAudibleNotificationSound(this.notificationSound),
        volume: this.notificationSound.volume,
      },
      this.language,
    );
  }

  public useCustomNotificationSound(sound: { fileName: string; source: string }): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      {
        customFileName: UserPreferences.validateCustomSoundFileName(sound.fileName),
        customSource: UserPreferences.validateCustomSoundSource(sound.source),
        mode: "custom",
        mutedFrom: null,
        volume: this.notificationSound.volume,
      },
      this.language,
    );
  }

  public changeNotificationSoundVolume(volume: number): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      {
        ...this.notificationSound,
        volume: UserPreferences.validateNotificationSoundVolume(volume),
      },
      this.language,
    );
  }

  public changeLanguage(language: LanguagePreference): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      this.notificationSound,
      UserPreferences.validateLanguage(language),
    );
  }

  private static createFocusTerm(value: number): DurationMinutes {
    if (!Number.isInteger(value) || value < 1 || value > 180) {
      throw new Error("Focus term must be between 1 and 180 minutes.");
    }

    return DurationMinutes.create(value);
  }

  private static createRestTerm(value: number): DurationMinutes {
    if (!Number.isInteger(value) || value < 1 || value > 60) {
      throw new Error("Rest term must be between 1 and 60 minutes.");
    }

    return DurationMinutes.create(value);
  }

  private static defaultNotificationSound(volume = 1): NotificationSoundPreference {
    return {
      customFileName: null,
      customSource: null,
      mode: "default",
      mutedFrom: null,
      volume: UserPreferences.validateNotificationSoundVolume(volume),
    };
  }

  private static restoreNotificationSound(sound: Partial<NotificationSoundPreference> | undefined): NotificationSoundPreference {
    const volume = UserPreferences.restoreNotificationSoundVolume(sound);

    if (!sound || sound.mode === "default") {
      return UserPreferences.defaultNotificationSound(volume);
    }

    if (sound.mode === "muted") {
      return {
        customFileName: null,
        customSource: null,
        mode: "muted",
        mutedFrom: UserPreferences.restoreMutedFrom(sound),
        volume,
      };
    }

    if (sound.mode === "custom" && sound.customFileName && sound.customSource) {
      return {
        customFileName: UserPreferences.validateCustomSoundFileName(sound.customFileName),
        customSource: UserPreferences.validateCustomSoundSource(sound.customSource),
        mode: "custom",
        mutedFrom: null,
        volume,
      };
    }

    return UserPreferences.defaultNotificationSound(volume);
  }

  private restoreAudibleNotificationSound(): UserPreferences {
    const sound = this.notificationSound.mutedFrom
      ? UserPreferences.restoreAudibleSoundWithVolume(this.notificationSound.mutedFrom, this.notificationSound.volume)
      : UserPreferences.defaultNotificationSound(this.notificationSound.volume);

    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      sound,
      this.language,
    );
  }

  private static snapshotAudibleNotificationSound(sound: NotificationSoundPreference): AudibleNotificationSoundPreference {
    if (sound.mode === "custom") {
      return {
        customFileName: sound.customFileName,
        customSource: sound.customSource,
        mode: "custom",
      };
    }

    return {
      customFileName: null,
      customSource: null,
      mode: "default",
    };
  }

  private static restoreAudibleSoundWithVolume(sound: AudibleNotificationSoundPreference, volume: number): NotificationSoundPreference {
    if (sound.mode === "custom" && sound.customFileName && sound.customSource) {
      return {
        customFileName: UserPreferences.validateCustomSoundFileName(sound.customFileName),
        customSource: UserPreferences.validateCustomSoundSource(sound.customSource),
        mode: "custom",
        mutedFrom: null,
        volume: UserPreferences.validateNotificationSoundVolume(volume),
      };
    }

    return UserPreferences.defaultNotificationSound(volume);
  }

  private static restoreMutedFrom(sound: Partial<NotificationSoundPreference>): AudibleNotificationSoundPreference | null {
    const mutedFrom = sound.mutedFrom;

    if (!mutedFrom) {
      return null;
    }

    if (mutedFrom.mode === "default") {
      return {
        customFileName: null,
        customSource: null,
        mode: "default",
      };
    }

    if (mutedFrom.mode === "custom" && mutedFrom.customFileName && mutedFrom.customSource) {
      return {
        customFileName: UserPreferences.validateCustomSoundFileName(mutedFrom.customFileName),
        customSource: UserPreferences.validateCustomSoundSource(mutedFrom.customSource),
        mode: "custom",
      };
    }

    return null;
  }

  private static validateCustomSoundFileName(fileName: string): string {
    const trimmedFileName = fileName.trim();

    if (!trimmedFileName.toLowerCase().endsWith(".mp3")) {
      throw new Error("Custom notification sound must be an mp3 file.");
    }

    return trimmedFileName;
  }

  private static validateCustomSoundSource(source: string): string {
    const trimmedSource = source.trim();

    if (trimmedSource.length === 0) {
      throw new Error("Custom notification sound source is required.");
    }

    return trimmedSource;
  }

  private static restoreNotificationSoundVolume(sound: Partial<NotificationSoundPreference> | undefined): number {
    if (sound?.volume === undefined) {
      return 1;
    }

    return UserPreferences.validateNotificationSoundVolume(sound.volume);
  }

  private static validateNotificationSoundVolume(volume: number): number {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new Error("Notification sound volume must be between 0 and 1.");
    }

    return volume;
  }

  private static restoreLanguage(language: string | undefined): LanguagePreference {
    if (language === "en") {
      return "en";
    }

    return "kor";
  }

  private static validateLanguage(language: LanguagePreference): LanguagePreference {
    return language;
  }
}
