import { useEffect, useReducer, type Dispatch } from "react";
import type { AppModules } from "../app/contracts/AppModules";
import type { RhythmStatusSnapshot } from "../contexts/rhythm/public";

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
  modules: Pick<AppModules, "rhythm">,
  initialNow: Date,
): RhythmAppViewModel {
  const [state, dispatch] = useReducer(reducer, {
    message: "",
    now: initialNow,
    status: modules.rhythm.getStatus.execute(),
  });

  useEffect((): (() => void) => {
    const timer = window.setInterval((): void => {
      dispatch({ type: "TICK", now: new Date() });
    }, 500);

    return (): void => window.clearInterval(timer);
  }, []);

  return {
    ...state,
    pause: async (): Promise<void> => runStatusAction(() => modules.rhythm.pause.execute(), dispatch),
    resume: async (): Promise<void> => runStatusAction(() => modules.rhythm.resume.execute(), dispatch),
    start: async (): Promise<void> => runStatusAction(() => modules.rhythm.start.execute(), dispatch),
    stopForToday: async (): Promise<void> => runStatusAction(() => modules.rhythm.stopForToday.execute(), dispatch),
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
  dispatch: Dispatch<RhythmAppAction>,
): Promise<void> {
  try {
    dispatch({ type: "STATUS_CHANGED", status: await action() });
  } catch (error) {
    dispatch({ type: "MESSAGE_CHANGED", message: error instanceof Error ? error.message : "Unknown error" });
  }
}
