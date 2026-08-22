import type { UserPreferences } from "../../domain/UserPreferences";

export interface PreferencesChangedPort {
  notify(preferences: UserPreferences): void;
}
