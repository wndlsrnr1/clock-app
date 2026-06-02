import { AnalogClock } from "./components/AnalogClock";
import { CalendarPage } from "./components/CalendarPage";
import { DigitalClock } from "./components/DigitalClock";
import { NotificationSoundPanel } from "./components/NotificationSoundPanel";
import { RhythmControls } from "./components/RhythmControls";
import { RhythmSettingsPanel } from "./components/RhythmSettingsPanel";
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
  const todo = useTodoApp(services, initialNow);

  return (
    <main className="app-shell">
      <section className="box">
        <nav className="app-nav" aria-label="앱 화면">
          <button className={todo.page === "clock" ? "nav-button active" : "nav-button"} onClick={() => void todo.showClock()} type="button">시계</button>
          <button className={todo.page === "calendar" ? "nav-button active" : "nav-button"} onClick={() => void todo.showCalendar()} type="button">캘린더</button>
        </nav>
        {todo.page === "clock" ? (
          <>
            <div className="ui-grid">
              <AnalogClock now={rhythm.now} />
              <div>
                <DigitalClock now={rhythm.now} />
                <div className="controls">
                  <div className="status-strip">
                    <span>상태</span>
                    <strong>{rhythm.status.sessionStatus}</strong>
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
                  />
                  <NotificationSoundPanel rhythm={rhythm} />
                  <RhythmControls
                    onPause={rhythm.pause}
                    onResume={rhythm.resume}
                    onStart={rhythm.start}
                    onStopForToday={rhythm.stopForToday}
                    status={rhythm.status.sessionStatus}
                  />
                </div>
              </div>
            </div>
            <TodayTodoPanel todo={todo} />
          </>
        ) : (
          <CalendarPage todo={todo} />
        )}
      </section>
    </main>
  );
}
