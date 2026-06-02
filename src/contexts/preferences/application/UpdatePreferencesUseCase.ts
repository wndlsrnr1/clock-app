import { UserPreferences } from "../domain/UserPreferences";
import type { RhythmRuntime } from "../../rhythm/application/RhythmRuntime";
import type { AutoStartPort, SettingsRepository } from "../../rhythm/application/ports";

export interface UpdatePreferencesCommand {
  focusMinutes: number;
  restMinutes: number;
  dailyStart: string;
  dailyEnd: string;
  autoStartEnabled: boolean;
}

export class UpdatePreferencesUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly autoStart: AutoStartPort,
    private readonly runtime: RhythmRuntime | null = null,
  ) {}

  public async execute(command: UpdatePreferencesCommand): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get())
      .changeTerms(command.focusMinutes, command.restMinutes)
      .changeDailyRhythm(command.dailyStart, command.dailyEnd)
      .changeAutoStart(command.autoStartEnabled);
    await this.settingsRepository.save(preferences);
    this.runtime?.replacePreferences(preferences);

    if (preferences.autoStart.enabled) {
      await this.autoStart.enable();
      return preferences;
    }

    await this.autoStart.disable();
    return preferences;
  }
}
