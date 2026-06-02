import type { RhythmSessionStatus } from "../../contexts/rhythm/domain/RhythmSession";

interface RhythmControlsProps {
  status: RhythmSessionStatus;
  onStart(): Promise<void>;
  onPause(): Promise<void>;
  onResume(): Promise<void>;
  onStopForToday(): Promise<void>;
}

export function RhythmControls({
  status,
  onStart,
  onPause,
  onResume,
  onStopForToday,
}: RhythmControlsProps): React.JSX.Element {
  return (
    <div className="buttons">
      <button className="btn" onClick={() => void onStart()} type="button">
        시작
      </button>
      <button className="btn" disabled={status !== "running"} onClick={() => void onPause()} type="button">
        일시정지
      </button>
      <button className="btn" disabled={status !== "paused"} onClick={() => void onResume()} type="button">
        재개
      </button>
      <button className="btn secondary" onClick={() => void onStopForToday()} type="button">
        오늘 종료
      </button>
    </div>
  );
}

