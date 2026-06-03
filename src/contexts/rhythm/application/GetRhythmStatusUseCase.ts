import type { RhythmStatusSnapshot } from "./RhythmStatusSnapshot";
import { RhythmRuntime } from "./RhythmRuntime";
import { snapshotRhythmStatus } from "./snapshotRhythmStatus";

export class GetRhythmStatusUseCase {
  public constructor(private readonly runtime: RhythmRuntime) {}

  public execute(): RhythmStatusSnapshot {
    return snapshotRhythmStatus(this.runtime);
  }
}

