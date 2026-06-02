import { AnalogClock } from "./components/AnalogClock";
import { CalendarPage } from "./components/CalendarPage";
import { DigitalClock } from "./components/DigitalClock";
import { NotificationSoundPanel } from "./components/NotificationSoundPanel";
import { RhythmControls } from "./components/RhythmControls";
import { RhythmSettingsPanel } from "./components/RhythmSettingsPanel";
import { SegmentedControl } from "./components/SegmentedControl";
import { TodayTodoPanel } from "./components/TodayTodoPanel";
import type { RhythmAppServices } from "./RhythmAppServices";
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

  return (
    <main className="app-shell">
      <section className="box">
        <nav className="app-nav" aria-label={text.navigation.aria}>
          <SegmentedControl
            ariaLabel={text.navigation.aria}
            onChange={(page) => (page === "clock" ? todo.showClock() : todo.showCalendar())}
            options={[
              { label: text.navigation.clock, value: "clock" },
              { label: text.navigation.calendar, value: "calendar" },
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
        ) : (
          <CalendarPage language={rhythm.status.language} todo={todo} text={text} />
        )}
      </section>
    </main>
  );
}
