import { AnalogClock } from "../../contexts/rhythm/presentation/AnalogClock";
import { DigitalClock } from "../../contexts/rhythm/presentation/DigitalClock";
import { NotificationSoundPanel } from "../../contexts/preferences/presentation/sound/NotificationSoundPanel";
import { RhythmControls } from "../../contexts/rhythm/presentation/RhythmControls";
import { RhythmSettingsDisclosure } from "../../contexts/preferences/presentation/settings/RhythmSettingsDisclosure";
import { RhythmSettingsPanel } from "../../contexts/preferences/presentation/settings/RhythmSettingsPanel";
import { TodayTodoPanel } from "../../contexts/todo/presentation/today/TodayTodoPanel";
import { previewRhythmSettings } from "../../contexts/preferences/application/queries/PreviewRhythmSettings";
import { createRhythmSettingsSummary } from "../../contexts/preferences/presentation/settings/rhythmSettingsSummary";
import type { PreferencesAppViewModel } from "../../contexts/preferences/presentation/usePreferencesApp";
import type { TextCatalog } from "../../shared/i18n/catalog";
import { formatText } from "../../shared/i18n/formatText";
import type { RhythmAppViewModel } from "../../contexts/rhythm/presentation/useRhythmApp";
import type { TodoAppViewModel } from "../../contexts/todo/presentation/useTodoApp";

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
