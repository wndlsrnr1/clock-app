import type { RhythmRuntime } from "./RhythmRuntime";
import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";

export function snapshotRhythmStatus(runtime: RhythmRuntime): RhythmStatusSnapshot {
  return {
    sessionStatus: runtime.session.status,
    focusMinutes: runtime.preferences.focusMinutes.value,
    restMinutes: runtime.preferences.restMinutes.value,
    dailyStart: runtime.preferences.dailyRhythm.start.toText(),
    dailyEnd: runtime.preferences.dailyRhythm.end.toText(),
    autoStartEnabled: runtime.preferences.autoStart.enabled,
    notificationSound: runtime.preferences.notificationSound,
    language: runtime.preferences.language,
    theme: runtime.preferences.theme,
    initialSetupCompleted: runtime.preferences.initialSetupCompleted,
  };
}
