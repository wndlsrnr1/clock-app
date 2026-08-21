import type { AppModules } from "../contracts/AppModules";
import type { RhythmAppServices } from "../../ui/RhythmAppServices";

export function createAppModules(services: RhythmAppServices): AppModules {
  return {
    rhythm: {
      getStatus: services.getStatus,
      pause: services.pauseRhythm,
      resume: services.resumeRhythm,
      start: services.startRhythm,
      stopForToday: services.stopForToday,
    },
    preferences: {
      changeLanguage: services.changeLanguage,
      changeTheme: services.changeTheme,
      chooseCustomNotificationSound: services.chooseCustomNotificationSound,
      muteNotificationSound: services.muteNotificationSound,
      previewNotificationSound: services.previewNotificationSound,
      stopNotificationSoundPreview: services.stopNotificationSoundPreview,
      update: services.updatePreferences,
      updateNotificationSoundVolume: services.updateNotificationSoundVolume,
      useDefaultNotificationSound: services.useDefaultNotificationSound,
    },
    todo: {
      add: services.addTodo,
      delete: services.deleteTodo,
      getByDate: services.getTodosByDate,
      getCalendarSummary: services.getTodoCalendarSummary,
      reorder: services.reorderTodos,
      toggle: services.toggleTodo,
      update: services.updateTodo,
    },
    dataTransfer: {
      exportBackup: services.exportBackup,
      importBackup: services.importBackup,
      previewImport: services.previewImportBackup,
    },
  };
}
