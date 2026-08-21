import { describe, expect, it } from "vitest";
import type { SoundSettingsReader, SoundSettingsSnapshot } from "../SoundSettingsReader";
import { NeutralinoSoundAdapter, type AudioElementPort } from "./NeutralinoSoundAdapter";

class FakeSoundSettingsReader implements SoundSettingsReader {
  public constructor(private readonly settings: SoundSettingsSnapshot) {}

  public async get(): Promise<SoundSettingsSnapshot> {
    return this.settings;
  }
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
      new FakeSoundSettingsReader({ customSource: null, mode: "muted", volume: 1 }),
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
    const adapter = new NeutralinoSoundAdapter(
      "/assets/default.mp3",
      new FakeSoundSettingsReader({ customSource: "/user-sounds/notification.mp3", mode: "custom", volume: 1 }),
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

  it("applies the saved app-only volume before playing audio", async () => {
    const createdAudios: Array<FakeAudio> = [];
    const adapter = new NeutralinoSoundAdapter(
      "/assets/default.mp3",
      new FakeSoundSettingsReader({ customSource: null, mode: "default", volume: 0.35 }),
      (source: string): AudioElementPort => {
        const audio = new FakeAudio(source);
        createdAudios.push(audio);
        return audio;
      },
    );

    await adapter.play();

    expect(createdAudios[0]?.volume).toBe(0.35);
  });

  it("stops the current preview audio and resets playback position", async () => {
    const createdAudios: Array<FakeAudio> = [];
    const adapter = new NeutralinoSoundAdapter(
      "/assets/default.mp3",
      new FakeSoundSettingsReader({ customSource: null, mode: "default", volume: 1 }),
      (source: string): AudioElementPort => {
        const audio = new FakeAudio(source);
        createdAudios.push(audio);
        return audio;
      },
    );

    await adapter.play();
    createdAudios[0].currentTime = 4;
    await adapter.stop();

    expect(createdAudios[0]?.pauseCount).toBe(1);
    expect(createdAudios[0]?.currentTime).toBe(0);
  });
});
