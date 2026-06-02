import { describe, expect, it } from "vitest";
import { UserPreferences } from "../domain/UserPreferences";
import { UpdatePreferencesUseCase } from "./UpdatePreferencesUseCase";
import type { AutoStartPort, SettingsRepository } from "../../rhythm/application/ports";

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

class FakePreferenceChangeRescheduler {
  public called = 0;

  public rescheduleIfRunning(): void {
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
    expect(autoStart.enabled).toBe(true);
  });

  it("asks the running rhythm rescheduler to refresh the next scheduled event after saving preferences", async () => {
    const repository = new FakeSettingsRepository();
    const autoStart = new FakeAutoStart();
    const rescheduler = new FakePreferenceChangeRescheduler();
    const useCase = new UpdatePreferencesUseCase(repository, autoStart, null, rescheduler);

    await useCase.execute({
      focusMinutes: 45,
      restMinutes: 15,
      dailyStart: "09:00",
      dailyEnd: "22:00",
      autoStartEnabled: false,
    });

    expect(rescheduler.called).toBe(1);
  });
});
