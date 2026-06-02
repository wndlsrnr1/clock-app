import { useEffect, useReducer, type Dispatch } from "react";
import type { LanguagePreference } from "../contexts/preferences/domain/UserPreferences";
import type { RhythmStatusSnapshot } from "../contexts/rhythm/application/RhythmStatusSnapshot";
import type { UpdatePreferencesCommand } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import type { RhythmAppServices } from "./RhythmAppServices";
import { createTranslator, formatText, type TextCatalog } from "./textCatalog";
import { normalizeOptionalTimeText } from "./timeText";

type RhythmFormState = UpdatePreferencesCommand;

interface RhythmAppState {
  now: Date;
  status: RhythmStatusSnapshot;
  form: RhythmFormState;
  isPreviewing: boolean;
  message: string;
}

type RhythmAppAction =
  | { type: "TICK"; now: Date }
  | { type: "STATUS_CHANGED"; status: RhythmStatusSnapshot }
  | { type: "PREVIEW_CHANGED"; isPreviewing: boolean }
  | { type: "FORM_CHANGED"; field: keyof RhythmFormState; value: string | number | boolean }
  | { type: "MESSAGE_CHANGED"; message: string };

export interface RhythmAppViewModel {
  now: Date;
  status: RhythmStatusSnapshot;
  form: RhythmFormState;
  isPreviewing: boolean;
  message: string;
  text: TextCatalog;
  changeFocusMinutes(value: number): void;
  changeRestMinutes(value: number): void;
  changeDailyStart(value: string): void;
  changeDailyEnd(value: string): void;
  changeAutoStart(enabled: boolean): void;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stopForToday(): Promise<void>;
  savePreferences(): Promise<void>;
  chooseCustomNotificationSound(): Promise<void>;
  changeNotificationSoundVolume(volume: number): Promise<void>;
  changeLanguage(language: LanguagePreference): Promise<void>;
  muteNotificationSound(): Promise<void>;
  toggleNotificationSoundPreview(): Promise<void>;
  useDefaultNotificationSound(): Promise<void>;
}

export function useRhythmApp(services: RhythmAppServices, initialNow: Date): RhythmAppViewModel {
  const [state, dispatch] = useReducer(reducer, createInitialState(services.getStatus.execute(), initialNow));
  const text = createTranslator(state.status.language);

  useEffect((): (() => void) => {
    const timer = window.setInterval(() => {
      dispatch({ type: "TICK", now: new Date() });
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  return {
    ...state,
    text,
    changeFocusMinutes: (value: number): void => dispatch({ type: "FORM_CHANGED", field: "focusMinutes", value }),
    changeRestMinutes: (value: number): void => dispatch({ type: "FORM_CHANGED", field: "restMinutes", value }),
    changeDailyStart: (value: string): void => dispatch({ type: "FORM_CHANGED", field: "dailyStart", value }),
    changeDailyEnd: (value: string): void => dispatch({ type: "FORM_CHANGED", field: "dailyEnd", value }),
    changeAutoStart: (enabled: boolean): void => dispatch({ type: "FORM_CHANGED", field: "autoStartEnabled", value: enabled }),
    start: async (): Promise<void> => applyStatus(await services.startRhythm.execute(), dispatch),
    pause: async (): Promise<void> => applyStatus(await services.pauseRhythm.execute(), dispatch),
    resume: async (): Promise<void> => applyStatus(await services.resumeRhythm.execute(), dispatch),
    stopForToday: async (): Promise<void> => applyStatus(await services.stopForToday.execute(), dispatch),
    savePreferences: async (): Promise<void> => {
      const normalizedForm = normalizedRhythmForm(state.form, text, dispatch);

      if (!normalizedForm) {
        return;
      }

      const preferences = await services.updatePreferences.execute(normalizedForm);
      dispatch({
        type: "STATUS_CHANGED",
        status: {
          ...state.status,
          autoStartEnabled: preferences.autoStart.enabled,
          dailyEnd: preferences.dailyRhythm.end.toText(),
          dailyStart: preferences.dailyRhythm.start.toText(),
          focusMinutes: preferences.focusMinutes.value,
          language: preferences.language,
          notificationSound: preferences.notificationSound,
          restMinutes: preferences.restMinutes.value,
        },
      });
      dispatch({ type: "MESSAGE_CHANGED", message: text.messages.preferencesSaved });
    },
    chooseCustomNotificationSound: async (): Promise<void> => {
      await services.stopNotificationSoundPreview.execute();
      const preferences = await services.chooseCustomNotificationSound.execute();
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "PREVIEW_CHANGED", isPreviewing: false });
      dispatch({ type: "MESSAGE_CHANGED", message: text.messages.customSoundChanged });
    },
    changeNotificationSoundVolume: async (volume: number): Promise<void> => {
      const preferences = await services.updateNotificationSoundVolume.execute(volume);
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "MESSAGE_CHANGED", message: formatText(text.messages.volumeChanged, { volume: Math.round(preferences.notificationSound.volume * 100) }) });
    },
    changeLanguage: async (language: LanguagePreference): Promise<void> => {
      const preferences = await services.changeLanguage.execute(language);
      const nextText = createTranslator(preferences.language);
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, language: preferences.language, notificationSound: preferences.notificationSound } });
      dispatch({ type: "MESSAGE_CHANGED", message: nextText.messages.languageChanged });
    },
    muteNotificationSound: async (): Promise<void> => {
      await services.stopNotificationSoundPreview.execute();
      const preferences = await services.muteNotificationSound.execute();
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "PREVIEW_CHANGED", isPreviewing: false });
      dispatch({ type: "MESSAGE_CHANGED", message: preferences.notificationSound.mode === "muted" ? text.messages.soundMuted : text.messages.soundUnmuted });
    },
    toggleNotificationSoundPreview: async (): Promise<void> => {
      if (state.isPreviewing) {
        await services.stopNotificationSoundPreview.execute();
        dispatch({ type: "PREVIEW_CHANGED", isPreviewing: false });
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.soundPreviewStopped });
        return;
      }

      await services.previewNotificationSound.execute();
      dispatch({ type: "PREVIEW_CHANGED", isPreviewing: true });
      dispatch({ type: "MESSAGE_CHANGED", message: text.messages.soundPreviewStarted });
    },
    useDefaultNotificationSound: async (): Promise<void> => {
      await services.stopNotificationSoundPreview.execute();
      const preferences = await services.useDefaultNotificationSound.execute();
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "PREVIEW_CHANGED", isPreviewing: false });
      dispatch({ type: "MESSAGE_CHANGED", message: text.messages.defaultSoundRestored });
    },
  };
}

function normalizedRhythmForm(
  form: RhythmFormState,
  text: TextCatalog,
  dispatch: Dispatch<RhythmAppAction>,
): RhythmFormState | null {
  try {
    const dailyStart = normalizeOptionalTimeText(form.dailyStart);
    const dailyEnd = normalizeOptionalTimeText(form.dailyEnd);

    if (!dailyStart || !dailyEnd) {
      throw new Error("Time is required.");
    }

    return { ...form, dailyEnd, dailyStart };
  } catch {
    dispatch({ type: "MESSAGE_CHANGED", message: text.messages.invalidTime });
    return null;
  }
}

function createInitialState(status: RhythmStatusSnapshot, now: Date): RhythmAppState {
  return {
    now,
    status,
    form: {
      focusMinutes: status.focusMinutes,
      restMinutes: status.restMinutes,
      dailyStart: status.dailyStart,
      dailyEnd: status.dailyEnd,
      autoStartEnabled: status.autoStartEnabled,
    },
    isPreviewing: false,
    message: "",
  };
}

function reducer(state: RhythmAppState, action: RhythmAppAction): RhythmAppState {
  if (action.type === "TICK") {
    return { ...state, now: action.now };
  }

  if (action.type === "STATUS_CHANGED") {
    return { ...state, status: action.status };
  }

  if (action.type === "MESSAGE_CHANGED") {
    return { ...state, message: action.message };
  }

  if (action.type === "PREVIEW_CHANGED") {
    return { ...state, isPreviewing: action.isPreviewing };
  }

  return {
    ...state,
    form: {
      ...state.form,
      [action.field]: action.value,
    },
  };
}

function applyStatus(
  status: RhythmStatusSnapshot,
  dispatch: Dispatch<RhythmAppAction>,
): void {
  dispatch({ type: "STATUS_CHANGED", status });
  dispatch({ type: "MESSAGE_CHANGED", message: statusMessage(status.sessionStatus, status.language) });
}

function statusMessage(status: RhythmStatusSnapshot["sessionStatus"], language: LanguagePreference): string {
  const text = createTranslator(language);

  if (status === "running") {
    return text.messages.rhythmRunning;
  }

  if (status === "paused") {
    return text.messages.rhythmPaused;
  }

  if (status === "stoppedForToday") {
    return text.messages.rhythmStoppedForToday;
  }

  return "";
}
