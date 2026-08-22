import { describe, expect, it } from "vitest";
import { UserPreferences } from "../domain/UserPreferences";
import { UpdatePreferencesUseCase } from "./UpdatePreferencesUseCase";
import type { AutoStartPort } from "./ports/AutoStartPort";
import type { PreferencesChangedPort } from "./ports/PreferencesChangedPort";
import type { SettingsRepository } from "./ports/SettingsRepository";

class FakeSettingsRepository implements SettingsRepository {
  public saved: UserPreferences | null = null;

  public async get(): Promise<UserPreferences> {
    return UserPreferences.default();
  }

  public async save(preferences: UserPreferences): Promise<void> {
    this.saved = preferences;
  }
}

class FakeAutoStart implements AutoStartPort {
  public enabled = false;

  public async enable(): Promise<void> {
    this.enabled = true;
  }

  public async disable(): Promise<void> {
    this.enabled = false;
  }

  public async isEnabled(): Promise<boolean> {
    return this.enabled;
  }
}

class FakePreferencesChanged implements PreferencesChangedPort {
  public called = 0;

  public notify(): void {
    this.called += 1;
  }
}

describe("UpdatePreferencesUseCase", () => {
  it("saves editable terms and enables auto start through the port", async () => {
    const repository = new FakeSettingsRepository();
    const autoStart = new FakeAutoStart();
    const useCase = new UpdatePreferencesUseCase(repository, autoStart);

    const preferences = await useCase.execute({
      focusMinutes: 45,
      restMinutes: 15,
      dailyStart: "09:00",
      dailyEnd: "22:00",
      autoStartEnabled: true,
    });

    expect(repository.saved).toBe(preferences);
    expect(preferences.focusMinutes.value).toBe(45);
    expect(preferences.restMinutes.value).toBe(15);
    expect(preferences.dailyRhythm.start.toText()).toBe("09:00");
    expect(preferences.autoStart.enabled).toBe(true);
    expect(preferences.initialSetupCompleted).toBe(true);
    expect(autoStart.enabled).toBe(true);
  });

  it("publishes the saved preferences after changing rhythm settings", async () => {
    const repository = new FakeSettingsRepository();
    const autoStart = new FakeAutoStart();
    const preferencesChanged = new FakePreferencesChanged();
    const useCase = new UpdatePreferencesUseCase(repository, autoStart, preferencesChanged);

    await useCase.execute({
      focusMinutes: 45,
      restMinutes: 15,
      dailyStart: "09:00",
      dailyEnd: "22:00",
      autoStartEnabled: false,
    });

    expect(preferencesChanged.called).toBe(1);
  });
});
