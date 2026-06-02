import type { UpdatePreferencesCommand } from "../../contexts/preferences/application/UpdatePreferencesUseCase";

interface RhythmSettingsPanelProps {
  form: UpdatePreferencesCommand;
  message: string;
  onFocusMinutesChange(value: number): void;
  onRestMinutesChange(value: number): void;
  onDailyStartChange(value: string): void;
  onDailyEndChange(value: string): void;
  onAutoStartChange(enabled: boolean): void;
  onSave(): Promise<void>;
}

export function RhythmSettingsPanel({
  form,
  message,
  onFocusMinutesChange,
  onRestMinutesChange,
  onDailyStartChange,
  onDailyEndChange,
  onAutoStartChange,
  onSave,
}: RhythmSettingsPanelProps): React.JSX.Element {
  return (
    <form className="settings-form" onSubmit={(event) => {
      event.preventDefault();
      void onSave();
    }}>
      <div className="grid">
        <label>
          <span className="label">집중 시간</span>
          <input
            aria-label="집중 시간"
            max={180}
            min={1}
            onChange={(event) => onFocusMinutesChange(Number(event.target.value))}
            type="number"
            value={form.focusMinutes}
          />
        </label>
        <label>
          <span className="label">휴식 시간</span>
          <input
            aria-label="휴식 시간"
            max={60}
            min={1}
            onChange={(event) => onRestMinutesChange(Number(event.target.value))}
            type="number"
            value={form.restMinutes}
          />
        </label>
        <label>
          <span className="label">하루 시작</span>
          <input aria-label="하루 시작" onChange={(event) => onDailyStartChange(event.target.value)} type="time" value={form.dailyStart} />
        </label>
        <label>
          <span className="label">하루 종료</span>
          <input aria-label="하루 종료" onChange={(event) => onDailyEndChange(event.target.value)} type="time" value={form.dailyEnd} />
        </label>
      </div>
      <label className="toggle-row">
        <input checked={form.autoStartEnabled} onChange={(event) => onAutoStartChange(event.target.checked)} type="checkbox" />
        <span>자동 시작</span>
      </label>
      <button className="btn secondary" type="submit">
        설정 저장
      </button>
      {message ? <p className="status-message">{message}</p> : null}
    </form>
  );
}

