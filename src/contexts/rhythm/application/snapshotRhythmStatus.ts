import type { RhythmRuntime } from "./RhythmRuntime";
import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";

export function snapshotRhythmStatus(runtime: RhythmRuntime): RhythmStatusSnapshot {
  const configuration = runtime.configurationSnapshot();

  return {
    sessionStatus: runtime.session.status,
    focusMinutes: configuration.focusTerm.value,
    restMinutes: configuration.restTerm.value,
    dailyStart: configuration.dailyRhythm.start.toText(),
    dailyEnd: configuration.dailyRhythm.end.toText(),
  };
}
