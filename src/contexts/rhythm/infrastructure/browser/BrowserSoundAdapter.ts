import type { SoundPort } from "../../application/ports";
import type { SoundSettingsReader, SoundSettingsSnapshot } from "../SoundSettingsReader";

export interface BrowserAudioElement {
  currentTime: number;
  preload: string;
  volume: number;
  pause(): void;
  play(): Promise<void>;
}

type AudioFactory = (source: string) => BrowserAudioElement;

export class BrowserSoundAdapter implements SoundPort {
  private audio: BrowserAudioElement | null = null;
  private currentSource: string | null = null;

  public constructor(
    private readonly defaultSource: string,
    private readonly settings: SoundSettingsReader,
    private readonly createAudio: AudioFactory = (source: string): BrowserAudioElement => new Audio(source),
  ) {}

  public async prepare(): Promise<void> {
    const audio = await this.currentAudio();

    if (!audio) {
      return;
    }

    const previousVolume = audio.volume;
    audio.volume = 0;

    try {
      await audio.play();
    } catch {
      return;
    } finally {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = previousVolume;
    }
  }

  public async play(): Promise<void> {
    const settings = await this.settings.get();
    const audio = await this.currentAudio(settings);

    if (!audio) {
      return;
    }

    audio.volume = settings.volume;
    audio.currentTime = 0;
    await audio.play();
  }

  public async stop(): Promise<void> {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
  }

  private async currentAudio(currentSettings?: SoundSettingsSnapshot): Promise<BrowserAudioElement | null> {
    const settings = currentSettings ?? await this.settings.get();
    const source = settings.mode === "custom" ? settings.customSource : this.defaultSource;

    if (settings.mode === "muted" || !source) {
      return null;
    }

    if (this.audio && this.currentSource === source) {
      return this.audio;
    }

    this.audio = this.createAudio(source);
    this.audio.preload = "auto";
    this.currentSource = source;

    return this.audio;
  }
}
