import type { UpdatePreferencesCommand } from "../../contexts/preferences/application/UpdatePreferencesUseCase";
import { rhythmMinuteRanges } from "../inputValidation";
import type { TextCatalog } from "../textCatalog";
import { NumberStepperField } from "./NumberStepperField";
import { TimeInputField } from "./TimeInputField";

interface RhythmSettingsPanelProps {
  form: UpdatePreferencesCommand;
  message: string;
  onFocusMinutesChange(value: number): void;
  onRestMinutesChange(value: number): void;
  onDailyStartChange(value: string): void;
  onDailyEndChange(value: string): void;
  onAutoStartChange(enabled: boolean): void;
  onSave(): Promise<void>;
  text: TextCatalog;
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
  text,
}: RhythmSettingsPanelProps): React.JSX.Element {
  return (
    <form className="settings-form" onSubmit={(event) => {
      event.preventDefault();
      void onSave();
    }}>
      <div className="grid">
        <NumberStepperField label={text.rhythm.settings.focusMinutes} max={rhythmMinuteRanges.focus.max} min={rhythmMinuteRanges.focus.min} onChange={onFocusMinutesChange} text={text} value={form.focusMinutes} />
        <NumberStepperField label={text.rhythm.settings.restMinutes} max={rhythmMinuteRanges.rest.max} min={rhythmMinuteRanges.rest.min} onChange={onRestMinutesChange} text={text} value={form.restMinutes} />
        <TimeInputField label={text.rhythm.settings.dailyStart} onChange={onDailyStartChange} text={text} value={form.dailyStart} />
        <TimeInputField label={text.rhythm.settings.dailyEnd} onChange={onDailyEndChange} text={text} value={form.dailyEnd} />
      </div>
      <label className="toggle-row">
        <input checked={form.autoStartEnabled} onChange={(event) => onAutoStartChange(event.target.checked)} type="checkbox" />
        <span>{text.rhythm.settings.autoStart}</span>
      </label>
      <button className="btn secondary" type="submit">
        {text.rhythm.settings.save}
      </button>
      {message ? <p className="status-message">{message}</p> : null}
    </form>
  );
}
