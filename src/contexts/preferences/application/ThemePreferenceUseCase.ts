import type { SettingsRepository } from "../../rhythm/application/ports";
import type { RhythmRuntime } from "../../rhythm/application/RhythmRuntime";
import type { ThemePreference, UserPreferences } from "../domain/UserPreferences";

export class ChangeThemePreferenceUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly runtime: RhythmRuntime | null = null,
  ) {}

  public async execute(theme: ThemePreference): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).changeTheme(theme);
    await this.settingsRepository.save(preferences);
    this.runtime?.replacePreferences(preferences);

    return preferences;
  }
}
