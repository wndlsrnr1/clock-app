import type { LanguagePreference } from "../../../shared/i18n/LanguagePreference";
import type { UserPreferences } from "../domain/UserPreferences";
import type { SettingsRepository } from "./ports/SettingsRepository";

export class ChangeLanguagePreferenceUseCase {
  public constructor(private readonly settingsRepository: SettingsRepository) {}

  public async execute(language: LanguagePreference): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).changeLanguage(language);
    await this.settingsRepository.save(preferences);
    return preferences;
  }
}
