import { useEffect, useReducer, type Dispatch } from "react";
import type { RhythmStatusSnapshot } from "../contexts/rhythm/application/RhythmStatusSnapshot";
import type { UpdatePreferencesCommand } from "../contexts/preferences/application/UpdatePreferencesUseCase";
import type { RhythmAppServices } from "./RhythmAppServices";

type RhythmFormState = UpdatePreferencesCommand;

interface RhythmAppState {
  now: Date;
  status: RhythmStatusSnapshot;
  form: RhythmFormState;
  message: string;
}

type RhythmAppAction =
  | { type: "TICK"; now: Date }
  | { type: "STATUS_CHANGED"; status: RhythmStatusSnapshot }
  | { type: "FORM_CHANGED"; field: keyof RhythmFormState; value: string | number | boolean }
  | { type: "MESSAGE_CHANGED"; message: string };

export interface RhythmAppViewModel {
  now: Date;
  status: RhythmStatusSnapshot;
  form: RhythmFormState;
  message: string;
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
  muteNotificationSound(): Promise<void>;
  previewNotificationSound(): Promise<void>;
  useDefaultNotificationSound(): Promise<void>;
}

export function useRhythmApp(services: RhythmAppServices, initialNow: Date): RhythmAppViewModel {
  const [state, dispatch] = useReducer(reducer, createInitialState(services.getStatus.execute(), initialNow));

  useEffect((): (() => void) => {
    const timer = window.setInterval(() => {
      dispatch({ type: "TICK", now: new Date() });
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  return {
    ...state,
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
      await services.updatePreferences.execute(state.form);
      dispatch({ type: "MESSAGE_CHANGED", message: "설정을 저장했습니다." });
    },
    chooseCustomNotificationSound: async (): Promise<void> => {
      const preferences = await services.chooseCustomNotificationSound.execute();
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "MESSAGE_CHANGED", message: "알림음을 변경했습니다." });
    },
    muteNotificationSound: async (): Promise<void> => {
      const preferences = await services.muteNotificationSound.execute();
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "MESSAGE_CHANGED", message: "무음으로 설정했습니다. 기본 알림은 유지됩니다." });
    },
    previewNotificationSound: async (): Promise<void> => {
      await services.previewNotificationSound.execute();
      dispatch({ type: "MESSAGE_CHANGED", message: "알림음을 미리 재생했습니다." });
    },
    useDefaultNotificationSound: async (): Promise<void> => {
      const preferences = await services.useDefaultNotificationSound.execute();
      dispatch({ type: "STATUS_CHANGED", status: { ...state.status, notificationSound: preferences.notificationSound } });
      dispatch({ type: "MESSAGE_CHANGED", message: "기본 학교종 알림음으로 되돌렸습니다." });
    },
  };
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
  dispatch({ type: "MESSAGE_CHANGED", message: statusMessage(status.sessionStatus) });
}

function statusMessage(status: RhythmStatusSnapshot["sessionStatus"]): string {
  if (status === "running") {
    return "리듬이 실행 중입니다.";
  }

  if (status === "paused") {
    return "리듬을 일시정지했습니다.";
  }

  if (status === "stoppedForToday") {
    return "오늘의 리듬을 종료했습니다.";
  }

  return "";
}
