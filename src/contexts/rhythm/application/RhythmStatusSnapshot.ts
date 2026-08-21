import type { RhythmSessionStatus } from "../domain/RhythmSession";

export interface RhythmStatusSnapshot {
  sessionStatus: RhythmSessionStatus;
  focusMinutes: number;
  restMinutes: number;
  dailyStart: string;
  dailyEnd: string;
}
