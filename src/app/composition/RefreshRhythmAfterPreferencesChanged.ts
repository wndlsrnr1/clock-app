import type { PreferencesChangedPort } from "../../contexts/preferences/application/ports/PreferencesChangedPort";
import type { UserPreferences } from "../../contexts/preferences/domain/UserPreferences";
import type { RhythmRuntime } from "../../contexts/rhythm/application/RhythmRuntime";
import type { RunningRhythmRescheduler } from "../../contexts/rhythm/application/RunningRhythmRescheduler";

export class RefreshRhythmAfterPreferencesChanged implements PreferencesChangedPort {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly rescheduler: RunningRhythmRescheduler,
  ) {}

  public notify(preferences: UserPreferences): void {
    this.runtime.replacePreferences(preferences);
    this.rescheduler.rescheduleIfRunning();
  }
}
