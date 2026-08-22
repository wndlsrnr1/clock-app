import type { UserPreferences } from "../../domain/UserPreferences";

export interface SettingsRepository {
  get(): Promise<UserPreferences>;
  save(preferences: UserPreferences): Promise<void>;
}
