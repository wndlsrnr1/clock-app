import type { RhythmSessionStatus } from "../domain/RhythmSession";
import type { LanguagePreference, NotificationSoundPreference } from "../../preferences/domain/UserPreferences";

export interface RhythmStatusSnapshot {
  sessionStatus: RhythmSessionStatus;
  focusMinutes: number;
  restMinutes: number;
  dailyStart: string;
  dailyEnd: string;
  autoStartEnabled: boolean;
  notificationSound: NotificationSoundPreference;
  language: LanguagePreference;
  initialSetupCompleted: boolean;
}
