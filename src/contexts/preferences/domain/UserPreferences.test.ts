import { describe, expect, it } from "vitest";
import { UserPreferences } from "./UserPreferences";

describe("UserPreferences", () => {
  it("uses the agreed personal rhythm defaults", () => {
    const preferences = UserPreferences.default();

    expect(preferences.focusMinutes.value).toBe(50);
    expect(preferences.restMinutes.value).toBe(10);
    expect(preferences.dailyRhythm.start.toText()).toBe("05:00");
    expect(preferences.dailyRhythm.end.toText()).toBe("18:00");
    expect(preferences.autoStart.enabled).toBe(false);
    expect(preferences.notificationSound.mode).toBe("default");
  });

  it("validates editable rhythm terms", () => {
    expect(() => UserPreferences.default().changeTerms(0, 10)).toThrow("Focus term must be between 1 and 180 minutes.");
    expect(() => UserPreferences.default().changeTerms(50, 0)).toThrow("Rest term must be between 1 and 60 minutes.");
  });

  it("keeps OS notifications while muting only the notification sound", () => {
    const preferences = UserPreferences.default().muteNotificationSound();

    expect(preferences.notificationSound.mode).toBe("muted");
    expect(preferences.notificationSound.customFileName).toBeNull();
    expect(preferences.notificationSound.customSource).toBeNull();
  });

  it("stores a copied custom mp3 notification sound", () => {
    const preferences = UserPreferences.default().useCustomNotificationSound({
      fileName: "bell.mp3",
      source: "/user-sounds/notification.mp3",
    });

    expect(preferences.notificationSound.mode).toBe("custom");
    expect(preferences.notificationSound.customFileName).toBe("bell.mp3");
    expect(preferences.notificationSound.customSource).toBe("/user-sounds/notification.mp3");
  });
});
