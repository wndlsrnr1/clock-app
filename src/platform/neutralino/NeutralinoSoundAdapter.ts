import type { SoundPort } from "../../contexts/rhythm/application/ports";
import type { SettingsRepository } from "../../contexts/rhythm/application/ports";
import type { NotificationSoundPreference } from "../../contexts/preferences/domain/UserPreferences";

export interface AudioElementPort {
  currentTime: number;
  preload: string;
  volume: number;
  pause(): void;
  play(): Promise<void>;
}

type AudioFactory = (source: string) => AudioElementPort;

export class NeutralinoSoundAdapter implements SoundPort {
  private audio: AudioElementPort | null = null;
  private currentSource: string | null = null;

  public constructor(
    private readonly defaultSource: string,
    private readonly settingsRepository: SettingsRepository,
    private readonly createAudio: AudioFactory = (source: string): AudioElementPort => new Audio(source),
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
    } finally {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = previousVolume;
    }
  }

  public async play(): Promise<void> {
    const audio = await this.currentAudio();

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    await audio.play();
  }

  private async currentAudio(): Promise<AudioElementPort | null> {
    const notificationSound = (await this.settingsRepository.get()).notificationSound;
    const source = this.resolveSource(notificationSound);

    if (!source) {
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

  private resolveSource(sound: NotificationSoundPreference): string | null {
    if (sound.mode === "muted") {
      return null;
    }

    if (sound.mode === "custom" && sound.customSource) {
      return sound.customSource;
    }

    return this.defaultSource;
  }
}
