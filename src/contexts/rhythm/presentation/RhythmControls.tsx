import type { RhythmSessionStatus } from "../domain/RhythmSession";
import type { TextCatalog } from "../../../ui/textCatalog";
import { IconButton } from "../../../ui/components/IconButton";

interface RhythmControlsProps {
  status: RhythmSessionStatus;
  onStart(): Promise<void>;
  onPause(): Promise<void>;
  onResume(): Promise<void>;
  onStopForToday(): Promise<void>;
  text: TextCatalog;
}

export function RhythmControls({
  status,
  onStart,
  onPause,
  onResume,
  onStopForToday,
  text,
}: RhythmControlsProps): React.JSX.Element {
  const play = status === "paused" ? onResume : onStart;

  return (
    <div className="icon-toolbar rhythm-toolbar">
      <IconButton disabled={status === "running"} icon="play" label={text.rhythm.controls.start} onClick={() => void play()} variant="primary" />
      <IconButton disabled={status !== "running"} icon="pause" label={text.rhythm.controls.pause} onClick={() => void onPause()} variant="secondary" />
      <IconButton icon="clock" label={text.rhythm.controls.stopForToday} onClick={() => void onStopForToday()} variant="secondary" />
    </div>
  );
}
