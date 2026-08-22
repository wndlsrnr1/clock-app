import {
  createRhythmSettingsSummary,
  NotificationSoundPanel,
  previewRhythmSettings,
  RhythmSettingsDisclosure,
  RhythmSettingsPanel,
  type PreferencesAppViewModel,
} from "../../contexts/preferences/public-presentation";
import { AnalogClock, DigitalClock, RhythmControls, type RhythmAppViewModel } from "../../contexts/rhythm/public-presentation";
import { TodayTodoPanel, type TodoAppViewModel } from "../../contexts/todo/public-presentation";
import type { TextCatalog } from "../../shared/i18n/catalog";
import { formatText } from "../../shared/i18n/formatText";

interface ClockPageProps {
  preferences: PreferencesAppViewModel;
  rhythm: RhythmAppViewModel;
  text: TextCatalog;
  todo: TodoAppViewModel;
}

export function ClockPage({ preferences, rhythm, text, todo }: ClockPageProps): React.JSX.Element {
  const settingsPreview = previewRhythmSettings(preferences.form, rhythm.now);
  const settingsSummary = createRhythmSettingsSummary(
    preferences.form,
    preferences.preferences,
    settingsPreview,
    text,
  );

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
              {settingsPreview.status === "ready" ? (
                <>
                  <p>{formatText(text.rhythm.settings.nextAlarm, { time: settingsPreview.nextAlarmTime })}</p>
                  {settingsPreview.isOutsideDailyRhythm ? <p className="warning-text">{text.rhythm.settings.outsideDailyRhythm}</p> : null}
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
          form={preferences.form}
          message={preferences.message}
          onAutoStartChange={preferences.changeAutoStart}
          onDailyEndChange={preferences.changeDailyEnd}
          onDailyStartChange={preferences.changeDailyStart}
          onFocusMinutesChange={preferences.changeFocusMinutes}
          onRestMinutesChange={preferences.changeRestMinutes}
          onSave={preferences.save}
          text={text}
        />
        <NotificationSoundPanel preferences={preferences} text={text} />
      </RhythmSettingsDisclosure>
    </>
  );
}
