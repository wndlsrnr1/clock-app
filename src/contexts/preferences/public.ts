import type { UpdatePreferencesCommand } from "./application/UpdatePreferencesUseCase";
import type {
  LanguagePreference,
  ThemePreference,
  UserPreferences,
  UserPreferencesSnapshot,
} from "./domain/UserPreferences";
export { GetPreferencesUseCase } from "./application/queries/GetPreferencesUseCase";

export { ChangeLanguagePreferenceUseCase } from "./application/LanguagePreferenceUseCase";
export {
  ChooseCustomNotificationSoundUseCase,
  PreviewNotificationSoundUseCase,
  SetNotificationSoundModeUseCase,
  StopNotificationSoundPreviewUseCase,
  UpdateNotificationSoundVolumeUseCase,
} from "./application/NotificationSoundUseCases";
export { ChangeThemePreferenceUseCase } from "./application/ThemePreferenceUseCase";
export { UpdatePreferencesUseCase, type UpdatePreferencesCommand } from "./application/UpdatePreferencesUseCase";
export {
  UserPreferences,
  type LanguagePreference,
  type NotificationSoundPreference,
  type ThemePreference,
  type UserPreferencesSnapshot,
} from "./domain/UserPreferences";

export interface PreferencesModule {
  get: { execute(): Promise<UserPreferencesSnapshot> };
  update: { execute(command: UpdatePreferencesCommand): Promise<UserPreferences> };
  chooseCustomNotificationSound: { execute(): Promise<UserPreferences> };
  muteNotificationSound: { execute(): Promise<UserPreferences> };
  previewNotificationSound: { execute(): Promise<void> };
  stopNotificationSoundPreview: { execute(): Promise<void> };
  updateNotificationSoundVolume: { execute(volume: number): Promise<UserPreferences> };
  useDefaultNotificationSound: { execute(): Promise<UserPreferences> };
  changeLanguage: { execute(language: LanguagePreference): Promise<UserPreferences> };
  changeTheme: { execute(theme: ThemePreference): Promise<UserPreferences> };
}
