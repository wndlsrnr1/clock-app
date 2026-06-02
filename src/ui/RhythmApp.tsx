import { AnalogClock } from "./components/AnalogClock";
import { CalendarPage } from "./components/CalendarPage";
import { DataPage } from "./components/DataPage";
import { DigitalClock } from "./components/DigitalClock";
import { NotificationSoundPanel } from "./components/NotificationSoundPanel";
import { RhythmControls } from "./components/RhythmControls";
import { RhythmSettingsPanel } from "./components/RhythmSettingsPanel";
import { SegmentedControl } from "./components/SegmentedControl";
import { TodayTodoPanel } from "./components/TodayTodoPanel";
import type { RhythmAppServices } from "./RhythmAppServices";
import { useLayoutMode } from "./useLayoutMode";
import { useRhythmApp } from "./useRhythmApp";
import { useTodoApp } from "./useTodoApp";

interface RhythmAppProps {
  services: RhythmAppServices;
  initialNow?: Date;
}

export function RhythmApp({ services, initialNow = new Date() }: RhythmAppProps): React.JSX.Element {
  const rhythm = useRhythmApp(services, initialNow);
  const todo = useTodoApp(services, rhythm.now, rhythm.text);
  const text = rhythm.text;
  const { containerRef, layoutMode } = useLayoutMode();

  return (
    <main className="app-shell" ref={containerRef}>
      <section className={`box box--${layoutMode}`}>
        <nav className="app-nav" aria-label={text.navigation.aria}>
          <SegmentedControl
            ariaLabel={text.navigation.aria}
            onChange={(page) => {
              if (page === "clock") {
                void todo.showClock();
                return;
              }

              if (page === "calendar") {
                void todo.showCalendar();
                return;
              }

              void todo.showData();
            }}
            options={[
              { label: text.navigation.clock, value: "clock" },
              { label: text.navigation.calendar, value: "calendar" },
              { label: text.navigation.data, value: "data" },
            ]}
            value={todo.page}
          />
          <SegmentedControl
            ariaLabel={text.language.label}
            onChange={rhythm.changeLanguage}
            options={[
              { ariaLabel: text.language.korName, label: text.language.kor, value: "kor" },
              { ariaLabel: text.language.enName, label: text.language.en, value: "en" },
            ]}
            value={rhythm.status.language}
          />
        </nav>
        {todo.page === "clock" ? (
          <>
            <div className="ui-grid">
              <AnalogClock now={rhythm.now} />
              <div>
                <DigitalClock now={rhythm.now} />
                <div className="controls">
                  <div className="status-strip">
                    <span>{text.status.title}</span>
                    <strong>{text.status.values[rhythm.status.sessionStatus]}</strong>
                  </div>
                  <RhythmSettingsPanel
                    form={rhythm.form}
                    message={rhythm.message}
                    onAutoStartChange={rhythm.changeAutoStart}
                    onDailyEndChange={rhythm.changeDailyEnd}
                    onDailyStartChange={rhythm.changeDailyStart}
                    onFocusMinutesChange={rhythm.changeFocusMinutes}
                    onRestMinutesChange={rhythm.changeRestMinutes}
                    onSave={rhythm.savePreferences}
                    settingsPreview={rhythm.settingsPreview}
                    text={text}
                  />
                  <NotificationSoundPanel rhythm={rhythm} text={text} />
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
          </>
        ) : todo.page === "calendar" ? (
          <CalendarPage language={rhythm.status.language} todo={todo} text={text} />
        ) : (
          <DataPage todo={todo} text={text} />
        )}
      </section>
    </main>
  );
}
