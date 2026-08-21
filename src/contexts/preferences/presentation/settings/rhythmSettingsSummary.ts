import type { TextCatalog } from "../../../../ui/textCatalog";
import { formatText } from "../../../../ui/textCatalog";
import type { RhythmSettingsPreview } from "../../application/queries/PreviewRhythmSettings";
import type { UpdatePreferencesCommand } from "../../application/UpdatePreferencesUseCase";
import type { UserPreferencesSnapshot } from "../../domain/UserPreferences";

export interface RhythmSettingsSummary {
  chips: Array<string>;
  isDirty: boolean;
  isInvalid: boolean;
  shouldOpenOnInitialRender: boolean;
  text: string;
}

export function createRhythmSettingsSummary(
  form: UpdatePreferencesCommand,
  preferences: UserPreferencesSnapshot,
  settingsPreview: RhythmSettingsPreview,
  text: TextCatalog,
): RhythmSettingsSummary {
  const isDirty = isRhythmSettingsDirty(form, preferences);
  const isInvalid = settingsPreview.status === "invalid";
  const chips = rhythmSettingsChips(isDirty, isInvalid, preferences, settingsPreview, text);

  return {
    chips,
    isDirty,
    isInvalid,
    shouldOpenOnInitialRender: !preferences.initialSetupCompleted || isInvalid,
    text: formatText(text.rhythm.disclosure.summary, {
      dailyEnd: form.dailyEnd,
      dailyStart: form.dailyStart,
      focus: form.focusMinutes,
      rest: form.restMinutes,
      sound: notificationSoundLabel(preferences, text),
    }),
  };
}

function isRhythmSettingsDirty(form: UpdatePreferencesCommand, preferences: UserPreferencesSnapshot): boolean {
  return form.focusMinutes !== preferences.focusMinutes
    || form.restMinutes !== preferences.restMinutes
    || form.dailyStart !== preferences.dailyStart
    || form.dailyEnd !== preferences.dailyEnd
    || form.autoStartEnabled !== preferences.autoStartEnabled;
}

function rhythmSettingsChips(
  isDirty: boolean,
  isInvalid: boolean,
  preferences: UserPreferencesSnapshot,
  settingsPreview: RhythmSettingsPreview,
  text: TextCatalog,
): Array<string> {
  const chips: Array<string> = [];

  if (isDirty) {
    chips.push(text.rhythm.disclosure.dirty);
  }

  if (isInvalid) {
    chips.push(text.rhythm.disclosure.invalid);
  }

  if (preferences.notificationSound.mode === "muted") {
    chips.push(text.rhythm.disclosure.muted);
  } else if (preferences.notificationSound.volume === 0) {
    chips.push(text.rhythm.disclosure.zeroVolume);
  }

  if (settingsPreview.status === "ready" && settingsPreview.isOutsideDailyRhythm) {
    chips.push(text.rhythm.disclosure.outsideDailyRhythm);
  }

  return chips;
}

function notificationSoundLabel(preferences: UserPreferencesSnapshot, text: TextCatalog): string {
  if (preferences.notificationSound.mode === "muted") {
    return text.sound.mutedLabel;
  }

  if (preferences.notificationSound.mode === "custom") {
    return preferences.notificationSound.customFileName ?? text.sound.customFallback;
  }

  return text.sound.defaultLabel;
}
