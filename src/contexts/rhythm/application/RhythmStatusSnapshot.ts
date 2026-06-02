import type { RhythmSessionStatus } from "../domain/RhythmSession";
import type { NotificationSoundPreference } from "../../preferences/domain/UserPreferences";

export interface RhythmStatusSnapshot {
  sessionStatus: RhythmSessionStatus;
  focusMinutes: number;
  restMinutes: number;
  dailyStart: string;
  dailyEnd: string;
  autoStartEnabled: boolean;
  notificationSound: NotificationSoundPreference;
}
