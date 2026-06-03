import { storage } from "@neutralinojs/lib";
import type { SettingsRepository } from "../../contexts/rhythm/application/ports";
import { UserPreferences, type UserPreferencesSnapshot } from "../../contexts/preferences/domain/UserPreferences";

export interface NeutralinoStoragePort {
  getData(key: string): Promise<string>;
  setData(key: string, value: string): Promise<void>;
}

type SavedPreferences = Partial<UserPreferencesSnapshot> & {
  focusMinutes: number;
  restMinutes: number;
  dailyStart: string;
  dailyEnd: string;
  autoStartEnabled: boolean;
};

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
    await this.neutralinoStorage.setData(this.key, JSON.stringify(preferences.snapshot()));
  }
}
