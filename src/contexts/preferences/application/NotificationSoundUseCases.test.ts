import { describe, expect, it, vi } from "vitest";
import { UserPreferences } from "../domain/UserPreferences";
import type { SettingsRepository, SoundPort } from "../../rhythm/application/ports";
import {
  ChooseCustomNotificationSoundUseCase,
  PreviewNotificationSoundUseCase,
  SetNotificationSoundModeUseCase,
  type NotificationSoundFilePort,
} from "./NotificationSoundUseCases";

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

class FakeNotificationSoundFilePort implements NotificationSoundFilePort {
  public async chooseCustomMp3(): Promise<{ fileName: string; source: string } | null> {
    return {
      fileName: "bell.mp3",
      source: "/user-sounds/notification.mp3",
    };
  }
}

describe("Notification sound use cases", () => {
  it("saves muted sound preference without disabling OS notifications", async () => {
    const repository = new FakeSettingsRepository();
    const useCase = new SetNotificationSoundModeUseCase(repository);

    const preferences = await useCase.mute();

    expect(repository.saved).toBe(preferences);
    expect(preferences.notificationSound.mode).toBe("muted");
  });

  it("saves selected custom mp3 sound preference", async () => {
    const repository = new FakeSettingsRepository();
    const useCase = new ChooseCustomNotificationSoundUseCase(repository, new FakeNotificationSoundFilePort());

    const preferences = await useCase.execute();

    expect(preferences.notificationSound.mode).toBe("custom");
    expect(preferences.notificationSound.customFileName).toBe("bell.mp3");
    expect(preferences.notificationSound.customSource).toBe("/user-sounds/notification.mp3");
  });

  it("previews the current notification sound through the sound port", async () => {
    const sound: SoundPort = {
      prepare: vi.fn<() => Promise<void>>(() => Promise.resolve()),
      play: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    };
    const useCase = new PreviewNotificationSoundUseCase(sound);

    await useCase.execute();

    expect(sound.play).toHaveBeenCalledOnce();
  });
});
