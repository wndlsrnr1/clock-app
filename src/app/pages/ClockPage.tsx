import { AnalogClock } from "../../ui/components/AnalogClock";
import { DigitalClock } from "../../ui/components/DigitalClock";
import { NotificationSoundPanel } from "../../ui/components/NotificationSoundPanel";
import { RhythmControls } from "../../ui/components/RhythmControls";
import { RhythmSettingsDisclosure } from "../../ui/components/RhythmSettingsDisclosure";
import { RhythmSettingsPanel } from "../../ui/components/RhythmSettingsPanel";
import { TodayTodoPanel } from "../../ui/components/TodayTodoPanel";
import { createRhythmSettingsSummary } from "../../ui/rhythmSettingsSummary";
import { formatText, type TextCatalog } from "../../ui/textCatalog";
import type { RhythmAppViewModel } from "../../ui/useRhythmApp";
import type { TodoAppViewModel } from "../../ui/useTodoApp";

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
