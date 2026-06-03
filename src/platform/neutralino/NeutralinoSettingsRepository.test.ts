import { describe, expect, it } from "vitest";
import { NeutralinoSettingsRepository } from "./NeutralinoSettingsRepository";

class FakeStorage {
  public data = new Map<string, string>();

  public async getData(key: string): Promise<string> {
    const value = this.data.get(key);

    if (!value) {
      throw new Error("missing");
    }

    return value;
  }

  public async setData(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }
}

describe("NeutralinoSettingsRepository", () => {
  it("returns default preferences when storage has no saved data", async () => {
    const repository = new NeutralinoSettingsRepository(new FakeStorage());

    const preferences = await repository.get();

    expect(preferences.focusMinutes.value).toBe(50);
    expect(preferences.dailyRhythm.start.toText()).toBe("05:00");
  });

  it("persists and restores user preferences", async () => {
    const storage = new FakeStorage();
    const repository = new NeutralinoSettingsRepository(storage);
    const preferences = (await repository.get()).changeTerms(45, 15).changeDailyRhythm("09:00", "22:00").changeAutoStart(true);

    await repository.save(preferences);
    const restored = await repository.get();

    expect(restored.focusMinutes.value).toBe(45);
    expect(restored.restMinutes.value).toBe(15);
    expect(restored.dailyRhythm.end.toText()).toBe("22:00");
    expect(restored.autoStart.enabled).toBe(true);
  });

  it("persists and restores custom notification sound preferences", async () => {
    const storage = new FakeStorage();
    const repository = new NeutralinoSettingsRepository(storage);
    const preferences = (await repository.get()).useCustomNotificationSound({
      fileName: "school-bell.mp3",
      source: "/user-sounds/notification.mp3",
    });

    await repository.save(preferences);
    const restored = await repository.get();

    expect(restored.notificationSound.mode).toBe("custom");
    expect(restored.notificationSound.customFileName).toBe("school-bell.mp3");
    expect(restored.notificationSound.customSource).toBe("/user-sounds/notification.mp3");
  });
});
