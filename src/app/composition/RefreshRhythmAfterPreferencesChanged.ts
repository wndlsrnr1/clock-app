import type { PreferencesChangedPort } from "../../contexts/preferences/application/ports/PreferencesChangedPort";
import type { UserPreferences } from "../../contexts/preferences/domain/UserPreferences";
import type { RhythmRuntime } from "../../contexts/rhythm/application/RhythmRuntime";
import type { RunningRhythmRescheduler } from "../../contexts/rhythm/application/RunningRhythmRescheduler";
import { RhythmConfiguration } from "../../contexts/rhythm/public-model";

export class RefreshRhythmAfterPreferencesChanged implements PreferencesChangedPort {
  public constructor(
    private readonly runtime: RhythmRuntime,
    private readonly rescheduler: RunningRhythmRescheduler,
  ) {}

  public notify(preferences: UserPreferences): void {
    this.runtime.replaceConfiguration(RhythmConfiguration.create({
      dailyRhythm: preferences.dailyRhythm,
      focusTerm: preferences.focusMinutes,
      restTerm: preferences.restMinutes,
    }));
    this.rescheduler.rescheduleIfRunning();
  }
}
