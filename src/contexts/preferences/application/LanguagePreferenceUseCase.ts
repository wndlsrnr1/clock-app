import type { SettingsRepository } from "../../rhythm/application/ports";
import type { RhythmRuntime } from "../../rhythm/application/RhythmRuntime";
import type { LanguagePreference, UserPreferences } from "../domain/UserPreferences";

export class ChangeLanguagePreferenceUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly runtime: RhythmRuntime | null = null,
  ) {}

  public async execute(language: LanguagePreference): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).changeLanguage(language);
    await this.settingsRepository.save(preferences);
    this.runtime?.replacePreferences(preferences);

    return preferences;
  }
}
