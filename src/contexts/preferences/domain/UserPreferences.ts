import { ClockTime } from "../../rhythm/domain/ClockTime";
import { DailyRhythm } from "../../rhythm/domain/DailyRhythm";
import { DurationMinutes } from "../../rhythm/domain/DurationMinutes";

export interface AutoStartPreference {
  enabled: boolean;
}

export type NotificationSoundMode = "default" | "custom" | "muted";

export interface NotificationSoundPreference {
  mode: NotificationSoundMode;
  customFileName: string | null;
  customSource: string | null;
}

export class UserPreferences {
  private constructor(
    public readonly focusMinutes: DurationMinutes,
    public readonly restMinutes: DurationMinutes,
    public readonly dailyRhythm: DailyRhythm,
    public readonly autoStart: AutoStartPreference,
    public readonly notificationSound: NotificationSoundPreference,
  ) {}

  public static default(): UserPreferences {
    return new UserPreferences(
      DurationMinutes.create(50),
      DurationMinutes.create(10),
      DailyRhythm.default(),
      { enabled: false },
      UserPreferences.defaultNotificationSound(),
    );
  }

  public static restore(properties: {
    focusMinutes: number;
    restMinutes: number;
    dailyStart: string;
    dailyEnd: string;
    autoStartEnabled: boolean;
    notificationSound?: Partial<NotificationSoundPreference>;
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
    );
  }

  public changeTerms(focusMinutes: number, restMinutes: number): UserPreferences {
    return new UserPreferences(
      UserPreferences.createFocusTerm(focusMinutes),
      UserPreferences.createRestTerm(restMinutes),
      this.dailyRhythm,
      this.autoStart,
      this.notificationSound,
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
    );
  }

  public changeAutoStart(enabled: boolean): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      { enabled },
      this.notificationSound,
    );
  }

  public useDefaultNotificationSound(): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      UserPreferences.defaultNotificationSound(),
    );
  }

  public muteNotificationSound(): UserPreferences {
    return new UserPreferences(
      this.focusMinutes,
      this.restMinutes,
      this.dailyRhythm,
      this.autoStart,
      {
        customFileName: null,
        customSource: null,
        mode: "muted",
      },
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
      },
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

  private static defaultNotificationSound(): NotificationSoundPreference {
    return {
      customFileName: null,
      customSource: null,
      mode: "default",
    };
  }

  private static restoreNotificationSound(sound: Partial<NotificationSoundPreference> | undefined): NotificationSoundPreference {
    if (!sound || sound.mode === "default") {
      return UserPreferences.defaultNotificationSound();
    }

    if (sound.mode === "muted") {
      return {
        customFileName: null,
        customSource: null,
        mode: "muted",
      };
    }

    if (sound.mode === "custom" && sound.customFileName && sound.customSource) {
      return {
        customFileName: UserPreferences.validateCustomSoundFileName(sound.customFileName),
        customSource: UserPreferences.validateCustomSoundSource(sound.customSource),
        mode: "custom",
      };
    }

    return UserPreferences.defaultNotificationSound();
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
}
