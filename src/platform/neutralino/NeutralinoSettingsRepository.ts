import { storage } from "@neutralinojs/lib";
import type { SettingsRepository } from "../../contexts/rhythm/application/ports";
import { UserPreferences, type NotificationSoundPreference } from "../../contexts/preferences/domain/UserPreferences";

export interface NeutralinoStoragePort {
  getData(key: string): Promise<string>;
  setData(key: string, value: string): Promise<void>;
}

interface SavedPreferences {
  focusMinutes: number;
  restMinutes: number;
  dailyStart: string;
  dailyEnd: string;
  autoStartEnabled: boolean;
  notificationSound?: NotificationSoundPreference;
}

export class NeutralinoSettingsRepository implements SettingsRepository {
  private readonly key = "user-preferences";

  public constructor(private readonly neutralinoStorage: NeutralinoStoragePort = storage) {}

  public async get(): Promise<UserPreferences> {
    try {
      const savedText = await this.neutralinoStorage.getData(this.key);
      const saved = JSON.parse(savedText) as SavedPreferences;

      return UserPreferences.restore(saved);
    } catch {
      return UserPreferences.default();
    }
  }

  public async save(preferences: UserPreferences): Promise<void> {
    const saved: SavedPreferences = {
      focusMinutes: preferences.focusMinutes.value,
      restMinutes: preferences.restMinutes.value,
      dailyStart: preferences.dailyRhythm.start.toText(),
      dailyEnd: preferences.dailyRhythm.end.toText(),
      autoStartEnabled: preferences.autoStart.enabled,
      notificationSound: preferences.notificationSound,
    };

    await this.neutralinoStorage.setData(this.key, JSON.stringify(saved));
  }
}
