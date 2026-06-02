import type { RhythmAppViewModel } from "../useRhythmApp";

interface NotificationSoundPanelProps {
  rhythm: RhythmAppViewModel;
}

export function NotificationSoundPanel({ rhythm }: NotificationSoundPanelProps): React.JSX.Element {
  const sound = rhythm.status.notificationSound;
  const label = sound.mode === "custom"
    ? sound.customFileName ?? "커스텀 mp3"
    : sound.mode === "muted"
      ? "무음"
      : "기본 학교종";

  return (
    <section className="sound-panel" aria-labelledby="sound-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">Sound</p>
          <h2 id="sound-title">알림음</h2>
        </div>
        <span className="date-pill">{label}</span>
      </div>
      <div className="buttons slim-buttons">
        <button className="btn secondary compact" onClick={() => void rhythm.chooseCustomNotificationSound()} type="button">mp3 선택</button>
        <button className="btn secondary compact" onClick={() => void rhythm.useDefaultNotificationSound()} type="button">기본 학교종</button>
        <button className="btn secondary compact" onClick={() => void rhythm.muteNotificationSound()} type="button">무음</button>
        <button className="btn compact" onClick={() => void rhythm.previewNotificationSound()} type="button">미리듣기</button>
      </div>
    </section>
  );
}
