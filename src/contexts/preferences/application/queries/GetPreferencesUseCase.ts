import type { UserPreferencesSnapshot } from "../../domain/UserPreferences";
import type { SettingsRepository } from "../ports/SettingsRepository";

export class GetPreferencesUseCase {
  public constructor(private readonly preferences: SettingsRepository) {}

  public async execute(): Promise<UserPreferencesSnapshot> {
    return (await this.preferences.get()).snapshot();
  }
}
