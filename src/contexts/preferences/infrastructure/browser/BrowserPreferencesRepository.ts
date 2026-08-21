import type { SettingsRepository } from "../../application/ports/SettingsRepository";
import { UserPreferences } from "../../domain/UserPreferences";

export class BrowserPreferencesRepository implements SettingsRepository {
  private readonly key = "clock-rhythm-preview-preferences";

  public constructor(private readonly storage: Storage = localStorage) {}

  public current(): UserPreferences {
    return this.readSavedPreferences();
  }

  public async get(): Promise<UserPreferences> {
    return this.readSavedPreferences();
  }

  public async save(preferences: UserPreferences): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(preferences.snapshot()));
  }

  private readSavedPreferences(): UserPreferences {
    const savedText = this.storage.getItem(this.key);

    if (!savedText) {
      return UserPreferences.default();
    }

    try {
      return UserPreferences.restore(JSON.parse(savedText) as ReturnType<UserPreferences["snapshot"]>);
    } catch {
      return UserPreferences.default();
    }
  }
}
