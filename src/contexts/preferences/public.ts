import type { UpdatePreferencesCommand } from "./application/UpdatePreferencesUseCase";
import type {
  ThemePreference,
  UserPreferences,
  UserPreferencesSnapshot,
} from "./domain/UserPreferences";
import type { LanguagePreference } from "../../shared/i18n/LanguagePreference";
export { GetPreferencesUseCase } from "./application/queries/GetPreferencesUseCase";
export { ExportPreferencesSnapshotUseCase } from "./application/commands/ExportPreferencesSnapshotUseCase";
export { ReplacePreferencesSnapshotUseCase } from "./application/commands/ReplacePreferencesSnapshotUseCase";

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
  type NotificationSoundPreference,
  type ThemePreference,
  type UserPreferencesSnapshot,
} from "./domain/UserPreferences";
export type { LanguagePreference } from "../../shared/i18n/LanguagePreference";

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
