import { UserPreferences } from "../domain/UserPreferences";
import type { AutoStartPort } from "./ports/AutoStartPort";
import type { PreferencesChangedPort } from "./ports/PreferencesChangedPort";
import type { SettingsRepository } from "./ports/SettingsRepository";

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
    private readonly preferencesChanged: PreferencesChangedPort | null = null,
  ) {}

  public async execute(command: UpdatePreferencesCommand): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get())
      .changeTerms(command.focusMinutes, command.restMinutes)
      .changeDailyRhythm(command.dailyStart, command.dailyEnd)
      .changeAutoStart(command.autoStartEnabled)
      .completeInitialSetup();
    await this.settingsRepository.save(preferences);
    this.preferencesChanged?.notify(preferences);

    if (preferences.autoStart.enabled) {
      await this.autoStart.enable();
      return preferences;
    }

    await this.autoStart.disable();
    return preferences;
  }
}
