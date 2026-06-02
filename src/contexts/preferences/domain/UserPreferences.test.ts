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
    expect(preferences.notificationSound.volume).toBe(1);
    expect(preferences.language).toBe("kor");
  });

  it("validates editable rhythm terms", () => {
    expect(() => UserPreferences.default().changeTerms(0, 10)).toThrow("Focus term must be between 1 and 180 minutes.");
    expect(() => UserPreferences.default().changeTerms(50, 0)).toThrow("Rest term must be between 1 and 60 minutes.");
  });

  it("keeps OS notifications while muting only the notification sound", () => {
    const preferences = UserPreferences.default().toggleNotificationSoundMute();

    expect(preferences.notificationSound.mode).toBe("muted");
    expect(preferences.notificationSound.customFileName).toBeNull();
    expect(preferences.notificationSound.customSource).toBeNull();
  });

  it("restores the last audible sound when toggling mute off", () => {
    const preferences = UserPreferences.default()
      .useCustomNotificationSound({
        fileName: "bell.mp3",
        source: "/user-sounds/notification.mp3",
      })
      .toggleNotificationSoundMute()
      .toggleNotificationSoundMute();

    expect(preferences.notificationSound.mode).toBe("custom");
    expect(preferences.notificationSound.customFileName).toBe("bell.mp3");
    expect(preferences.notificationSound.customSource).toBe("/user-sounds/notification.mp3");
  });

  it("keeps the app notification sound volume inside the preference boundary", () => {
    const preferences = UserPreferences.default().changeNotificationSoundVolume(0.5);

    expect(preferences.notificationSound.volume).toBe(0.5);
    expect(preferences.useCustomNotificationSound({
      fileName: "bell.mp3",
      source: "/user-sounds/notification.mp3",
    }).notificationSound.volume).toBe(0.5);
    expect(preferences.toggleNotificationSoundMute().notificationSound.volume).toBe(0.5);
    expect(preferences.useDefaultNotificationSound().notificationSound.volume).toBe(0.5);
  });

  it("restores legacy preferences with full sound volume and Korean language", () => {
    const preferences = UserPreferences.restore({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 50,
      notificationSound: { mode: "custom", customFileName: "bell.mp3", customSource: "/user-sounds/notification.mp3" },
      restMinutes: 10,
    });

    expect(preferences.notificationSound.volume).toBe(1);
    expect(preferences.language).toBe("kor");
    expect(preferences.notificationSound.mutedFrom).toBeNull();
  });

  it("changes and restores the app language preference", () => {
    const preferences = UserPreferences.default().changeLanguage("en");

    expect(preferences.language).toBe("en");
    expect(UserPreferences.restore({
      autoStartEnabled: false,
      dailyEnd: "18:00",
      dailyStart: "05:00",
      focusMinutes: 50,
      language: "en",
      restMinutes: 10,
    }).language).toBe("en");
  });

  it("validates app notification sound volume", () => {
    expect(UserPreferences.default().changeNotificationSoundVolume(0).notificationSound.volume).toBe(0);
    expect(UserPreferences.default().changeNotificationSoundVolume(1).notificationSound.volume).toBe(1);
    expect(() => UserPreferences.default().changeNotificationSoundVolume(-0.1)).toThrow("Notification sound volume must be between 0 and 1.");
    expect(() => UserPreferences.default().changeNotificationSoundVolume(1.1)).toThrow("Notification sound volume must be between 0 and 1.");
  });

  it("stores a copied custom mp3 notification sound", () => {
    const preferences = UserPreferences.default().useCustomNotificationSound({
      fileName: "bell.mp3",
      source: "/user-sounds/notification.mp3",
    });

    expect(preferences.notificationSound.mode).toBe("custom");
    expect(preferences.notificationSound.customFileName).toBe("bell.mp3");
    expect(preferences.notificationSound.customSource).toBe("/user-sounds/notification.mp3");
    expect(preferences.notificationSound.volume).toBe(1);
  });
});
