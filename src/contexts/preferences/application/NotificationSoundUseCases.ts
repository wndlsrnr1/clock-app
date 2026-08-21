import type { UserPreferences } from "../domain/UserPreferences";
import type { NotificationSoundFilePort } from "./ports/NotificationSoundFilePort";
import type { SettingsRepository } from "./ports/SettingsRepository";
import type { SoundPreviewPort } from "./ports/SoundPreviewPort";

export type { NotificationSoundFilePort, SelectedNotificationSound } from "./ports/NotificationSoundFilePort";

export class SetNotificationSoundModeUseCase {
  public constructor(private readonly settingsRepository: SettingsRepository) {}

  public async useDefault(): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).useDefaultNotificationSound();
    await this.settingsRepository.save(preferences);

    return preferences;
  }

  public async toggleMute(): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).toggleNotificationSoundMute();
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
  public constructor(private readonly sound: SoundPreviewPort) {}

  public async execute(): Promise<void> {
    await this.sound.play();
  }
}

export class StopNotificationSoundPreviewUseCase {
  public constructor(private readonly sound: SoundPreviewPort) {}

  public async execute(): Promise<void> {
    await this.sound.stop();
  }
}

export class UpdateNotificationSoundVolumeUseCase {
  public constructor(private readonly settingsRepository: SettingsRepository) {}

  public async execute(volume: number): Promise<UserPreferences> {
    const preferences = (await this.settingsRepository.get()).changeNotificationSoundVolume(volume);
    await this.settingsRepository.save(preferences);

    return preferences;
  }
}
