import type { UserPreferencesSnapshot } from "../../domain/UserPreferences";
import type { SettingsRepository } from "../ports/SettingsRepository";

export class ExportPreferencesSnapshotUseCase {
  public constructor(private readonly settingsRepository: SettingsRepository) {}

  public async execute(): Promise<UserPreferencesSnapshot> {
    return (await this.settingsRepository.get()).snapshot();
  }
}
