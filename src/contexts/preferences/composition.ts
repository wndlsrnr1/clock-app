import { ChangeLanguagePreferenceUseCase } from "./application/LanguagePreferenceUseCase";
import {
  ChooseCustomNotificationSoundUseCase,
  PreviewNotificationSoundUseCase,
  SetNotificationSoundModeUseCase,
  StopNotificationSoundPreviewUseCase,
  UpdateNotificationSoundVolumeUseCase,
} from "./application/NotificationSoundUseCases";
import { ChangeThemePreferenceUseCase } from "./application/ThemePreferenceUseCase";
import { UpdatePreferencesUseCase } from "./application/UpdatePreferencesUseCase";
import type { AutoStartPort } from "./application/ports/AutoStartPort";
import type { NotificationSoundFilePort } from "./application/ports/NotificationSoundFilePort";
import type { PreferencesChangedPort } from "./application/ports/PreferencesChangedPort";
import type { SettingsRepository } from "./application/ports/SettingsRepository";
import type { SoundPreviewPort } from "./application/ports/SoundPreviewPort";
import { GetPreferencesUseCase } from "./application/queries/GetPreferencesUseCase";
import type { PreferencesModule } from "./public";

export function createPreferencesModule(
  repository: SettingsRepository,
  autoStart: AutoStartPort,
  soundFile: NotificationSoundFilePort,
  soundPreview: SoundPreviewPort,
  preferencesChanged: PreferencesChangedPort,
): PreferencesModule {
  const soundMode = new SetNotificationSoundModeUseCase(repository);

  return {
    changeLanguage: new ChangeLanguagePreferenceUseCase(repository),
    changeTheme: new ChangeThemePreferenceUseCase(repository),
    chooseCustomNotificationSound: new ChooseCustomNotificationSoundUseCase(repository, soundFile),
    get: new GetPreferencesUseCase(repository),
    muteNotificationSound: { execute: (): ReturnType<typeof soundMode.toggleMute> => soundMode.toggleMute() },
    previewNotificationSound: new PreviewNotificationSoundUseCase(soundPreview),
    stopNotificationSoundPreview: new StopNotificationSoundPreviewUseCase(soundPreview),
    update: new UpdatePreferencesUseCase(repository, autoStart, preferencesChanged),
    updateNotificationSoundVolume: new UpdateNotificationSoundVolumeUseCase(repository),
    useDefaultNotificationSound: { execute: (): ReturnType<typeof soundMode.useDefault> => soundMode.useDefault() },
  };
}
