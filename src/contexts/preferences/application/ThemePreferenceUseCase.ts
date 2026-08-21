import type { ThemePreference, UserPreferences } from "../domain/UserPreferences";
import type { SettingsRepository } from "./ports/SettingsRepository";

export class ChangeThemePreferenceUseCase {
  public constructor(private readonly settingsRepository: SettingsRepository) {}

  public async execute(theme: ThemePreference): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).changeTheme(theme);
    await this.settingsRepository.save(preferences);
    return preferences;
  }
}
