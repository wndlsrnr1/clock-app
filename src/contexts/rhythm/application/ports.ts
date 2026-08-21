import type { RhythmEvent } from "../domain/RhythmEvent";

export interface NotificationPort {
  notify(event: RhythmEvent): Promise<void>;
}

export interface SoundPort {
  prepare(): Promise<void>;
  play(): Promise<void>;
  stop(): Promise<void>;
}

export interface SchedulerPort {
  schedule(occursAt: Date, callback: () => void): string;
  cancel(taskId: string): void;
}

export interface TrayPort {
  updateStatus(status: string): Promise<void>;
}

