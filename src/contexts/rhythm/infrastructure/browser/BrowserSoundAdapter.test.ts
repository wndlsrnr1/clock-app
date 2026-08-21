import { describe, expect, it } from "vitest";
import type { SoundSettingsReader, SoundSettingsSnapshot } from "../SoundSettingsReader";
import { BrowserSoundAdapter, type BrowserAudioElement } from "./BrowserSoundAdapter";

class FakeSoundSettingsReader implements SoundSettingsReader {
  public constructor(private readonly settings: SoundSettingsSnapshot) {}

  public async get(): Promise<SoundSettingsSnapshot> {
    return this.settings;
  }
}

class FakeAudio implements BrowserAudioElement {
  public currentTime = 0;
  public preload = "";
  public volume = 1;
  public playCount = 0;

  public constructor(public readonly source: string) {}

  public async play(): Promise<void> {
    this.playCount += 1;
  }

  public pause(): void {}
}

describe("BrowserSoundAdapter", (): void => {
  it("uses the custom source and saved volume", async (): Promise<void> => {
    const createdAudios: Array<FakeAudio> = [];
    const adapter = new BrowserSoundAdapter(
      "/assets/default.mp3",
      new FakeSoundSettingsReader({ customSource: "blob:bell", mode: "custom", volume: 0.35 }),
      (source: string): BrowserAudioElement => {
        const audio = new FakeAudio(source);
        createdAudios.push(audio);
        return audio;
      },
    );

    await adapter.play();

    expect(createdAudios[0]?.source).toBe("blob:bell");
    expect(createdAudios[0]?.volume).toBe(0.35);
    expect(createdAudios[0]?.playCount).toBe(1);
  });

  it("does not create audio while notification sound is muted", async (): Promise<void> => {
    const createdSources: Array<string> = [];
    const adapter = new BrowserSoundAdapter(
      "/assets/default.mp3",
      new FakeSoundSettingsReader({ customSource: null, mode: "muted", volume: 1 }),
      (source: string): BrowserAudioElement => {
        createdSources.push(source);
        return new FakeAudio(source);
      },
    );

    await adapter.play();

    expect(createdSources).toEqual([]);
  });
});
