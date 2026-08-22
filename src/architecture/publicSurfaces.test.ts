import { describe, expect, it } from "vitest";
import * as rhythmPublic from "../contexts/rhythm/public";
import * as todoPublic from "../contexts/todo/public";
import * as preferencesPublic from "../contexts/preferences/public";
import * as dataTransferPublic from "../features/data-transfer/public";

describe("module public surfaces", (): void => {
  it("exposes only the application and model entry points needed by consumers", (): void => {
    expect(Object.keys(rhythmPublic).sort()).toEqual([
      "ClockTime",
      "DailyRhythm",
      "DurationMinutes",
      "GetRhythmStatusUseCase",
      "PauseRhythmUseCase",
      "ResumeRhythmUseCase",
      "RhythmConfiguration",
      "RhythmSession",
      "StartRhythmUseCase",
      "StopRhythmForTodayUseCase",
    ]);
    expect(Object.keys(todoPublic).sort()).toEqual([
      "AddTodoUseCase",
      "DeleteTodoUseCase",
      "ExportTodoSnapshotsUseCase",
      "GetTodoCalendarSummaryUseCase",
      "GetTodosByDateUseCase",
      "ReorderTodosUseCase",
      "ReplaceTodoSnapshotsUseCase",
      "TodoItem",
      "TodoTitle",
      "ToggleTodoUseCase",
      "UpdateTodoUseCase",
    ]);
    expect(Object.keys(preferencesPublic).sort()).toEqual([
      "ChangeLanguagePreferenceUseCase",
      "ChangeThemePreferenceUseCase",
      "ChooseCustomNotificationSoundUseCase",
      "ExportPreferencesSnapshotUseCase",
      "GetPreferencesUseCase",
      "PreviewNotificationSoundUseCase",
      "ReplacePreferencesSnapshotUseCase",
      "SetNotificationSoundModeUseCase",
      "StopNotificationSoundPreviewUseCase",
      "UpdateNotificationSoundVolumeUseCase",
      "UpdatePreferencesUseCase",
      "UserPreferences",
    ]);
    expect(Object.keys(dataTransferPublic).sort()).toEqual([
      "ExportBackupUseCase",
      "ImportBackupUseCase",
      "PreviewBackupImportUseCase",
    ]);
  });
});
