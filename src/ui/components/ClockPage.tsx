import { AnalogClock } from "./AnalogClock";
import { DigitalClock } from "./DigitalClock";
import { NotificationSoundPanel } from "./NotificationSoundPanel";
import { RhythmControls } from "./RhythmControls";
import { RhythmSettingsDisclosure } from "./RhythmSettingsDisclosure";
import { RhythmSettingsPanel } from "./RhythmSettingsPanel";
import { TodayTodoPanel } from "./TodayTodoPanel";
import type { RhythmAppViewModel } from "../useRhythmApp";
import type { TodoAppViewModel } from "../useTodoApp";
import { createRhythmSettingsSummary } from "../rhythmSettingsSummary";
import { formatText, type TextCatalog } from "../textCatalog";

interface ClockPageProps {
  rhythm: RhythmAppViewModel;
  text: TextCatalog;
  todo: TodoAppViewModel;
}

export function ClockPage({ rhythm, text, todo }: ClockPageProps): React.JSX.Element {
  const settingsSummary = createRhythmSettingsSummary(rhythm.form, rhythm.status, rhythm.settingsPreview, text);

  return (
    <>
      <div className="ui-grid">
        <AnalogClock now={rhythm.now} />
        <div>
          <DigitalClock now={rhythm.now} />
          <div className="controls clock-controls">
            <div className="status-strip">
              <span>{text.status.title}</span>
              <strong>{text.status.values[rhythm.status.sessionStatus]}</strong>
            </div>
            <div className="settings-preview clock-next-alarm">
              {rhythm.settingsPreview.status === "ready" ? (
                <>
                  <p>{formatText(text.rhythm.settings.nextAlarm, { time: rhythm.settingsPreview.nextAlarmTime })}</p>
                  {rhythm.settingsPreview.isOutsideDailyRhythm ? <p className="warning-text">{text.rhythm.settings.outsideDailyRhythm}</p> : null}
                </>
              ) : (
                <p className="warning-text">{text.rhythm.settings.nextAlarmUnavailable}</p>
              )}
            </div>
            <RhythmControls
              onPause={rhythm.pause}
              onResume={rhythm.resume}
              onStart={rhythm.start}
              onStopForToday={rhythm.stopForToday}
              status={rhythm.status.sessionStatus}
              text={text}
            />
          </div>
        </div>
      </div>
      <TodayTodoPanel todo={todo} text={text} />
      <RhythmSettingsDisclosure summary={settingsSummary} text={text}>
        <RhythmSettingsPanel
          form={rhythm.form}
          message={rhythm.message}
          onAutoStartChange={rhythm.changeAutoStart}
          onDailyEndChange={rhythm.changeDailyEnd}
          onDailyStartChange={rhythm.changeDailyStart}
          onFocusMinutesChange={rhythm.changeFocusMinutes}
          onRestMinutesChange={rhythm.changeRestMinutes}
          onSave={rhythm.savePreferences}
          text={text}
        />
        <NotificationSoundPanel rhythm={rhythm} text={text} />
      </RhythmSettingsDisclosure>
    </>
  );
}
