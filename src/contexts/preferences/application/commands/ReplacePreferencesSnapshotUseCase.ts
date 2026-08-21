import { UserPreferences, type UserPreferencesSnapshot } from "../../domain/UserPreferences";
import type { PreferencesChangedPort } from "../ports/PreferencesChangedPort";
import type { SettingsRepository } from "../ports/SettingsRepository";

export class ReplacePreferencesSnapshotUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly preferencesChanged: PreferencesChangedPort,
  ) {}

  public async execute(snapshot: UserPreferencesSnapshot): Promise<void> {
    const preferences = UserPreferences.restore(snapshot);
    await this.settingsRepository.save(preferences);
    this.preferencesChanged.notify(preferences);
  }
}
