import type { UpdatePreferencesCommand } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import type { RhythmStatusSnapshot } from "../contexts/rhythm/application/RhythmStatusSnapshot";
import type { RhythmSettingsPreview } from "./rhythmPreview";
import { formatText, type TextCatalog } from "./textCatalog";

export interface RhythmSettingsSummary {
  chips: Array<string>;
  isDirty: boolean;
  isInvalid: boolean;
  shouldOpenOnInitialRender: boolean;
  text: string;
}

export function createRhythmSettingsSummary(
  form: UpdatePreferencesCommand,
  status: RhythmStatusSnapshot,
  settingsPreview: RhythmSettingsPreview,
  text: TextCatalog,
): RhythmSettingsSummary {
  const isDirty = isRhythmSettingsDirty(form, status);
  const isInvalid = settingsPreview.status === "invalid";
  const chips = rhythmSettingsChips(isDirty, isInvalid, status, settingsPreview, text);

  return {
    chips,
    isDirty,
    isInvalid,
    shouldOpenOnInitialRender: !status.initialSetupCompleted || isInvalid,
    text: formatText(text.rhythm.disclosure.summary, {
      dailyEnd: form.dailyEnd,
      dailyStart: form.dailyStart,
      focus: form.focusMinutes,
      rest: form.restMinutes,
      sound: notificationSoundLabel(status, text),
    }),
  };
}

function isRhythmSettingsDirty(form: UpdatePreferencesCommand, status: RhythmStatusSnapshot): boolean {
  return form.focusMinutes !== status.focusMinutes
    || form.restMinutes !== status.restMinutes
    || form.dailyStart !== status.dailyStart
    || form.dailyEnd !== status.dailyEnd
    || form.autoStartEnabled !== status.autoStartEnabled;
}

function rhythmSettingsChips(
  isDirty: boolean,
  isInvalid: boolean,
  status: RhythmStatusSnapshot,
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

  if (status.notificationSound.mode === "muted") {
    chips.push(text.rhythm.disclosure.muted);
  } else if (status.notificationSound.volume === 0) {
    chips.push(text.rhythm.disclosure.zeroVolume);
  }

  if (settingsPreview.status === "ready" && settingsPreview.isOutsideDailyRhythm) {
    chips.push(text.rhythm.disclosure.outsideDailyRhythm);
  }

  return chips;
}

function notificationSoundLabel(status: RhythmStatusSnapshot, text: TextCatalog): string {
  if (status.notificationSound.mode === "muted") {
    return text.sound.mutedLabel;
  }

  if (status.notificationSound.mode === "custom") {
    return status.notificationSound.customFileName ?? text.sound.customFallback;
  }

  return text.sound.defaultLabel;
}
