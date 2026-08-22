import { useEffect, useReducer, type Dispatch } from "react";
import type { RhythmModule, RhythmStatusSnapshot } from "../public";
import type { TextCatalog } from "../../../shared/i18n/catalog";

interface RhythmAppState {
  now: Date;
  status: RhythmStatusSnapshot;
  message: string;
}

type RhythmAppAction =
  | { type: "TICK"; now: Date }
  | { type: "STATUS_CHANGED"; status: RhythmStatusSnapshot }
  | { type: "MESSAGE_CHANGED"; message: string };

export interface RhythmAppViewModel {
  now: Date;
  status: RhythmStatusSnapshot;
  message: string;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stopForToday(): Promise<void>;
}

export function useRhythmApp(
  rhythm: RhythmModule,
  initialNow: Date,
  text: TextCatalog,
): RhythmAppViewModel {
  const [state, dispatch] = useReducer(reducer, {
    message: "",
    now: initialNow,
    status: rhythm.getStatus.execute(),
  });

  useEffect((): (() => void) => {
    const timer = window.setInterval((): void => {
      dispatch({ type: "TICK", now: new Date() });
    }, 500);

    return (): void => window.clearInterval(timer);
  }, []);

  return {
    ...state,
    pause: async (): Promise<void> => runStatusAction(() => rhythm.pause.execute(), text.messages.rhythmPaused, dispatch),
    resume: async (): Promise<void> => runStatusAction(() => rhythm.resume.execute(), text.messages.rhythmRunning, dispatch),
    start: async (): Promise<void> => runStatusAction(() => rhythm.start.execute(), text.messages.rhythmRunning, dispatch),
    stopForToday: async (): Promise<void> => runStatusAction(() => rhythm.stopForToday.execute(), text.messages.rhythmStoppedForToday, dispatch),
  };
}

function reducer(state: RhythmAppState, action: RhythmAppAction): RhythmAppState {
  if (action.type === "TICK") {
    return { ...state, now: action.now };
  }

  if (action.type === "STATUS_CHANGED") {
    return { ...state, status: action.status };
  }

  return { ...state, message: action.message };
}

async function runStatusAction(
  action: () => Promise<RhythmStatusSnapshot>,
  successMessage: string,
  dispatch: Dispatch<RhythmAppAction>,
): Promise<void> {
  try {
    dispatch({ type: "STATUS_CHANGED", status: await action() });
    dispatch({ type: "MESSAGE_CHANGED", message: successMessage });
  } catch (error) {
    dispatch({ type: "MESSAGE_CHANGED", message: error instanceof Error ? error.message : "Unknown error" });
  }
}
