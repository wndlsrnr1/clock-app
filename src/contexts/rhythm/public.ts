import type { RhythmStatusSnapshot } from "./application/RhythmStatusSnapshot";

export * from "./public-model";
export { GetRhythmStatusUseCase } from "./application/GetRhythmStatusUseCase";
export { PauseRhythmUseCase } from "./application/PauseRhythmUseCase";
export { ResumeRhythmUseCase } from "./application/ResumeRhythmUseCase";
export { StartRhythmUseCase } from "./application/StartRhythmUseCase";
export { StopRhythmForTodayUseCase } from "./application/StopRhythmForTodayUseCase";
export type { RhythmStatusSnapshot } from "./application/RhythmStatusSnapshot";

export interface RhythmModule {
  start: { execute(): Promise<RhythmStatusSnapshot> };
  pause: { execute(): Promise<RhythmStatusSnapshot> };
  resume: { execute(): Promise<RhythmStatusSnapshot> };
  stopForToday: { execute(): Promise<RhythmStatusSnapshot> };
  getStatus: { execute(): RhythmStatusSnapshot };
}
