import type { SettingsRepository, SoundPort } from "../../rhythm/application/ports";
import type { UserPreferences } from "../domain/UserPreferences";

export interface SelectedNotificationSound {
  fileName: string;
  source: string;
}

export interface NotificationSoundFilePort {
  chooseCustomMp3(): Promise<SelectedNotificationSound | null>;
}

export class SetNotificationSoundModeUseCase {
  public constructor(private readonly settingsRepository: SettingsRepository) {}

  public async useDefault(): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).useDefaultNotificationSound();
    await this.settingsRepository.save(preferences);

    return preferences;
  }

  public async mute(): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).muteNotificationSound();
    await this.settingsRepository.save(preferences);

    return preferences;
  }
}

export class ChooseCustomNotificationSoundUseCase {
  public constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly soundFilePort: NotificationSoundFilePort,
  ) {}

  public async execute(): Promise<UserPreferences> {
    const selectedSound = await this.soundFilePort.chooseCustomMp3();
    const currentPreferences = await this.settingsRepository.get();

    if (!selectedSound) {
      return currentPreferences;
    }

    const preferences = currentPreferences.useCustomNotificationSound(selectedSound);
    await this.settingsRepository.save(preferences);

    return preferences;
  }
}

export class PreviewNotificationSoundUseCase {
  public constructor(private readonly sound: SoundPort) {}

  public async execute(): Promise<void> {
    await this.sound.play();
  }
}
