import type { RhythmConfiguration } from "../../domain/RhythmConfiguration";

export interface RhythmConfigurationReader {
  get(): Promise<RhythmConfiguration>;
}
