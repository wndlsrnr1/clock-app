import type { SettingsRepository } from "../../contexts/preferences/application/ports/SettingsRepository";
import type {
  SoundSettingsReader,
  SoundSettingsSnapshot,
} from "../../contexts/rhythm/infrastructure/SoundSettingsReader";

export class PreferencesSoundSettingsReader implements SoundSettingsReader {
  public constructor(private readonly preferences: SettingsRepository) {}

  public async get(): Promise<SoundSettingsSnapshot> {
    const sound = (await this.preferences.get()).notificationSound;

    return {
      customSource: sound.customSource,
      mode: sound.mode,
      volume: sound.volume,
    };
  }
}
