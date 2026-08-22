export interface SoundPreviewPort {
  play(): Promise<void>;
  stop(): Promise<void>;
}
