import { describe, expect, it } from "vitest";
import type { SettingsRepository } from "./ports/SettingsRepository";
import { UserPreferences } from "../domain/UserPreferences";
import { ChangeLanguagePreferenceUseCase } from "./LanguagePreferenceUseCase";

class FakeSettingsRepository implements SettingsRepository {
  public saved: UserPreferences | null = null;

  public constructor(private preferences: UserPreferences = UserPreferences.default()) {}

  public async get(): Promise<UserPreferences> {
    return this.preferences;
  }

  public async save(preferences: UserPreferences): Promise<void> {
    this.preferences = preferences;
    this.saved = preferences;
  }
}

describe("ChangeLanguagePreferenceUseCase", () => {
  it("saves the selected app language preference", async () => {
    const repository = new FakeSettingsRepository();
    const useCase = new ChangeLanguagePreferenceUseCase(repository);

    const preferences = await useCase.execute("en");

    expect(repository.saved).toBe(preferences);
    expect(preferences.language).toBe("en");
  });
});
