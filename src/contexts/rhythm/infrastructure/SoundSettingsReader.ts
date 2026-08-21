export interface SoundSettingsSnapshot {
  mode: "default" | "custom" | "muted";
  customSource: string | null;
  volume: number;
}

export interface SoundSettingsReader {
  get(): Promise<SoundSettingsSnapshot>;
}
