import type { UserPreferences } from "../../preferences/domain/UserPreferences";
import type { RhythmEvent } from "../domain/RhythmEvent";

export interface NotificationPort {
  notify(event: RhythmEvent): Promise<void>;
}

export interface SoundPort {
  prepare(): Promise<void>;
  play(): Promise<void>;
}

export interface SchedulerPort {
  schedule(occursAt: Date, callback: () => void): string;
  cancel(taskId: string): void;
}

export interface SystemClock {
  now(): Date;
}

export interface TrayPort {
  updateStatus(status: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<UserPreferences>;
  save(preferences: UserPreferences): Promise<void>;
}

export interface AutoStartPort {
  enable(): Promise<void>;
  disable(): Promise<void>;
  isEnabled(): Promise<boolean>;
}

