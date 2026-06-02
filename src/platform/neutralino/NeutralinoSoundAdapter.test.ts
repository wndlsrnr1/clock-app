import { describe, expect, it } from "vitest";
import type { SettingsRepository } from "../../contexts/rhythm/application/ports";
import { UserPreferences } from "../../contexts/preferences/domain/UserPreferences";
import { NeutralinoSoundAdapter, type AudioElementPort } from "./NeutralinoSoundAdapter";

class FakeSettingsRepository implements SettingsRepository {
  public constructor(private readonly preferences: UserPreferences) {}

  public async get(): Promise<UserPreferences> {
    return this.preferences;
  }

  public async save(): Promise<void> {}
}

class FakeAudio implements AudioElementPort {
  public currentTime = 0;
  public preload = "";
  public volume = 1;
  public playCount = 0;
  public pauseCount = 0;

  public constructor(public readonly source: string) {}

  public async play(): Promise<void> {
    this.playCount += 1;
  }

  public pause(): void {
    this.pauseCount += 1;
  }
}

describe("NeutralinoSoundAdapter", () => {
  it("does not play audio when notification sound is muted", async () => {
    const createdAudios: Array<FakeAudio> = [];
    const adapter = new NeutralinoSoundAdapter(
      "/assets/default.mp3",
      new FakeSettingsRepository(UserPreferences.default().muteNotificationSound()),
      (source: string): AudioElementPort => {
        const audio = new FakeAudio(source);
        createdAudios.push(audio);
        return audio;
      },
    );

    await adapter.play();

    expect(createdAudios).toHaveLength(0);
  });

  it("plays the copied custom mp3 source when a custom sound is selected", async () => {
    const createdAudios: Array<FakeAudio> = [];
    const preferences = UserPreferences.default().useCustomNotificationSound({
      fileName: "bell.mp3",
      source: "/user-sounds/notification.mp3",
    });
    const adapter = new NeutralinoSoundAdapter(
      "/assets/default.mp3",
      new FakeSettingsRepository(preferences),
      (source: string): AudioElementPort => {
        const audio = new FakeAudio(source);
        createdAudios.push(audio);
        return audio;
      },
    );

    await adapter.play();

    expect(createdAudios[0]?.source).toBe("/user-sounds/notification.mp3");
    expect(createdAudios[0]?.playCount).toBe(1);
  });
});
