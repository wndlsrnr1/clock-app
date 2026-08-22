import { useReducer, type Dispatch } from "react";
import { normalizeOptionalTimeText } from "../../../shared/time/normalizeTimeText";
import { createTranslator, type TextCatalog } from "../../../shared/i18n/catalog";
import { formatText } from "../../../shared/i18n/formatText";
import type {
  LanguagePreference,
  PreferencesModule,
  ThemePreference,
  UpdatePreferencesCommand,
  UserPreferences,
  UserPreferencesSnapshot,
} from "../public";

interface PreferencesAppState {
  preferences: UserPreferencesSnapshot;
  form: UpdatePreferencesCommand;
  isPreviewingSound: boolean;
  message: string;
}

type PreferencesAppAction =
  | { type: "PREFERENCES_CHANGED"; preferences: UserPreferencesSnapshot }
  | { type: "PREFERENCES_RELOADED"; preferences: UserPreferencesSnapshot }
  | { type: "FORM_CHANGED"; field: keyof UpdatePreferencesCommand; value: string | number | boolean }
  | { type: "PREVIEW_CHANGED"; isPreviewingSound: boolean }
  | { type: "MESSAGE_CHANGED"; message: string };

export interface PreferencesAppViewModel {
  preferences: UserPreferencesSnapshot;
  form: UpdatePreferencesCommand;
  isPreviewingSound: boolean;
  message: string;
  changeAutoStart(enabled: boolean): void;
  changeDailyEnd(value: string): void;
  changeDailyStart(value: string): void;
  changeFocusMinutes(value: number): void;
  changeLanguage(language: LanguagePreference): Promise<void>;
  changeNotificationSoundVolume(volume: number): Promise<void>;
  changeRestMinutes(value: number): void;
  changeTheme(theme: ThemePreference): Promise<void>;
  chooseCustomNotificationSound(): Promise<void>;
  muteNotificationSound(): Promise<void>;
  refresh(): Promise<void>;
  save(): Promise<void>;
  toggleNotificationSoundPreview(): Promise<void>;
  useDefaultNotificationSound(): Promise<void>;
}

export function usePreferencesApp(
  preferencesModule: PreferencesModule,
  initialPreferences: UserPreferencesSnapshot,
): PreferencesAppViewModel {
  const [state, dispatch] = useReducer(reducer, createInitialState(initialPreferences));
  const text = createTranslator(state.preferences.language);

  return {
    ...state,
    changeAutoStart: (enabled: boolean): void => dispatch({ type: "FORM_CHANGED", field: "autoStartEnabled", value: enabled }),
    changeDailyEnd: (value: string): void => dispatch({ type: "FORM_CHANGED", field: "dailyEnd", value }),
    changeDailyStart: (value: string): void => dispatch({ type: "FORM_CHANGED", field: "dailyStart", value }),
    changeFocusMinutes: (value: number): void => dispatch({ type: "FORM_CHANGED", field: "focusMinutes", value }),
    changeLanguage: async (language: LanguagePreference): Promise<void> => {
      const preferences = await preferencesModule.changeLanguage.execute(language);
      applyPreferences(preferences, dispatch);
      dispatch({ type: "MESSAGE_CHANGED", message: createTranslator(preferences.language).messages.languageChanged });
    },
    changeNotificationSoundVolume: async (volume: number): Promise<void> => {
      await runSoundAction(async (): Promise<void> => {
        const preferences = await preferencesModule.updateNotificationSoundVolume.execute(volume);
        applyPreferences(preferences, dispatch);
        dispatch({
          type: "MESSAGE_CHANGED",
          message: formatText(text.messages.volumeChanged, { volume: Math.round(preferences.notificationSound.volume * 100) }),
        });
      }, text, dispatch);
    },
    changeRestMinutes: (value: number): void => dispatch({ type: "FORM_CHANGED", field: "restMinutes", value }),
    changeTheme: async (theme: ThemePreference): Promise<void> => {
      const preferences = await preferencesModule.changeTheme.execute(theme);
      applyPreferences(preferences, dispatch);
      dispatch({ type: "MESSAGE_CHANGED", message: text.messages.themeChanged });
    },
    chooseCustomNotificationSound: async (): Promise<void> => {
      await runSoundAction(async (): Promise<void> => {
        await preferencesModule.stopNotificationSoundPreview.execute();
        const preferences = await preferencesModule.chooseCustomNotificationSound.execute();
        applyPreferences(preferences, dispatch);
        dispatch({ type: "PREVIEW_CHANGED", isPreviewingSound: false });
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.customSoundChanged });
      }, text, dispatch);
    },
    muteNotificationSound: async (): Promise<void> => {
      await runSoundAction(async (): Promise<void> => {
        await preferencesModule.stopNotificationSoundPreview.execute();
        const preferences = await preferencesModule.muteNotificationSound.execute();
        applyPreferences(preferences, dispatch);
        dispatch({ type: "PREVIEW_CHANGED", isPreviewingSound: false });
        dispatch({
          type: "MESSAGE_CHANGED",
          message: preferences.notificationSound.mode === "muted" ? text.messages.soundMuted : text.messages.soundUnmuted,
        });
      }, text, dispatch);
    },
    refresh: async (): Promise<void> => {
      dispatch({ type: "PREFERENCES_RELOADED", preferences: await preferencesModule.get.execute() });
    },
    save: async (): Promise<void> => {
      const normalizedForm = normalizeForm(state.form, text, dispatch);

      if (!normalizedForm) {
        return;
      }

      await runPreferenceAction(async (): Promise<void> => {
        const preferences = await preferencesModule.update.execute(normalizedForm);
        applyPreferences(preferences, dispatch);
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.preferencesSaved });
      }, text, dispatch, text.messages.preferencesFailed);
    },
    toggleNotificationSoundPreview: async (): Promise<void> => {
      if (state.isPreviewingSound) {
        await stopSoundPreview(preferencesModule, text, dispatch);
        return;
      }

      await runSoundAction(async (): Promise<void> => {
        await preferencesModule.previewNotificationSound.execute();
        dispatch({ type: "PREVIEW_CHANGED", isPreviewingSound: true });
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.soundPreviewStarted });
      }, text, dispatch);
    },
    useDefaultNotificationSound: async (): Promise<void> => {
      await runSoundAction(async (): Promise<void> => {
        await preferencesModule.stopNotificationSoundPreview.execute();
        const preferences = await preferencesModule.useDefaultNotificationSound.execute();
        applyPreferences(preferences, dispatch);
        dispatch({ type: "PREVIEW_CHANGED", isPreviewingSound: false });
        dispatch({ type: "MESSAGE_CHANGED", message: text.messages.defaultSoundRestored });
      }, text, dispatch);
    },
  };
}

function createInitialState(preferences: UserPreferencesSnapshot): PreferencesAppState {
  return {
    form: createForm(preferences),
    isPreviewingSound: false,
    message: "",
    preferences,
  };
}

function reducer(state: PreferencesAppState, action: PreferencesAppAction): PreferencesAppState {
  if (action.type === "PREFERENCES_CHANGED") {
    return { ...state, preferences: action.preferences };
  }

  if (action.type === "PREFERENCES_RELOADED") {
    return { ...state, form: createForm(action.preferences), preferences: action.preferences };
  }

  if (action.type === "PREVIEW_CHANGED") {
    return { ...state, isPreviewingSound: action.isPreviewingSound };
  }

  if (action.type === "MESSAGE_CHANGED") {
    return { ...state, message: action.message };
  }

  return { ...state, form: { ...state.form, [action.field]: action.value } };
}

function createForm(preferences: UserPreferencesSnapshot): UpdatePreferencesCommand {
  return {
    autoStartEnabled: preferences.autoStartEnabled,
    dailyEnd: preferences.dailyEnd,
    dailyStart: preferences.dailyStart,
    focusMinutes: preferences.focusMinutes,
    restMinutes: preferences.restMinutes,
  };
}

function applyPreferences(preferences: UserPreferences, dispatch: Dispatch<PreferencesAppAction>): void {
  dispatch({ type: "PREFERENCES_CHANGED", preferences: preferences.snapshot() });
}

function normalizeForm(
  form: UpdatePreferencesCommand,
  text: TextCatalog,
  dispatch: Dispatch<PreferencesAppAction>,
): UpdatePreferencesCommand | null {
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

async function stopSoundPreview(
  preferencesModule: PreferencesModule,
  text: TextCatalog,
  dispatch: Dispatch<PreferencesAppAction>,
): Promise<void> {
  await runSoundAction(async (): Promise<void> => {
    await preferencesModule.stopNotificationSoundPreview.execute();
    dispatch({ type: "PREVIEW_CHANGED", isPreviewingSound: false });
    dispatch({ type: "MESSAGE_CHANGED", message: text.messages.soundPreviewStopped });
  }, text, dispatch);
}

async function runSoundAction(
  action: () => Promise<void>,
  text: TextCatalog,
  dispatch: Dispatch<PreferencesAppAction>,
): Promise<void> {
  await runPreferenceAction(action, text, dispatch, text.messages.soundActionFailed);
}

async function runPreferenceAction(
  action: () => Promise<void>,
  text: TextCatalog,
  dispatch: Dispatch<PreferencesAppAction>,
  template: string,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    dispatch({ type: "MESSAGE_CHANGED", message: formatText(template, { message: actionErrorMessage(error, text) }) });
  }
}

function actionErrorMessage(error: unknown, text: TextCatalog): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return text.messages.unknownError;
}
