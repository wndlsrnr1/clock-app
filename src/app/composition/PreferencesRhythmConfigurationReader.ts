import type { SettingsRepository } from "../../contexts/preferences/application/ports/SettingsRepository";
import type { RhythmConfigurationReader } from "../../contexts/rhythm/application/ports/RhythmConfigurationReader";
import { RhythmConfiguration } from "../../contexts/rhythm/public-model";

export class PreferencesRhythmConfigurationReader implements RhythmConfigurationReader {
  public constructor(private readonly preferences: SettingsRepository) {}

  public async get(): Promise<RhythmConfiguration> {
    const preferences = await this.preferences.get();

    return RhythmConfiguration.create({
      dailyRhythm: preferences.dailyRhythm,
      focusTerm: preferences.focusMinutes,
      restTerm: preferences.restMinutes,
    });
  }
}
