import { describe, expect, it } from "vitest";
import type { SettingsRepository } from "../../rhythm/application/ports";
import { RhythmRuntime } from "../../rhythm/application/RhythmRuntime";
import { UserPreferences } from "../domain/UserPreferences";
import { ChangeThemePreferenceUseCase } from "./ThemePreferenceUseCase";

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

describe("ChangeThemePreferenceUseCase", () => {
  it("saves the selected app theme preference and updates the runtime snapshot", async () => {
    const repository = new FakeSettingsRepository();
    const runtime = RhythmRuntime.empty();
    const useCase = new ChangeThemePreferenceUseCase(repository, runtime);

    const preferences = await useCase.execute("tokyo-night");

    expect(repository.saved).toBe(preferences);
    expect(preferences.theme).toBe("tokyo-night");
    expect(runtime.preferences.theme).toBe("tokyo-night");
  });
});
