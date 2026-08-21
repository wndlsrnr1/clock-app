import { CalendarPage } from "./components/CalendarPage";
import { ClockPage } from "./components/ClockPage";
import { DataPage } from "./components/DataPage";
import { SegmentedControl } from "./components/SegmentedControl";
import { ThemePage } from "./components/ThemePage";
import type { AppModules } from "../app/contracts/AppModules";
import { useLayoutMode } from "./useLayoutMode";
import { useRhythmApp } from "./useRhythmApp";
import { useTodoApp } from "./useTodoApp";

interface RhythmAppProps {
  modules: AppModules;
  initialNow?: Date;
}

export function RhythmApp({ modules, initialNow = new Date() }: RhythmAppProps): React.JSX.Element {
  const rhythm = useRhythmApp(modules, initialNow);
  const todo = useTodoApp(modules, rhythm.now, rhythm.text);
  const text = rhythm.text;
  const { containerRef, layoutMode } = useLayoutMode();

  return (
    <main className="app-shell" data-theme={rhythm.status.theme} ref={containerRef}>
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

              if (page === "data") {
                void todo.showData();
                return;
              }

              void todo.showTheme();
            }}
            options={[
              { label: text.navigation.clock, value: "clock" },
              { label: text.navigation.calendar, value: "calendar" },
              { label: text.navigation.data, value: "data" },
              { label: text.navigation.theme, value: "theme" },
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
          <ClockPage rhythm={rhythm} text={text} todo={todo} />
        ) : todo.page === "calendar" ? (
          <CalendarPage language={rhythm.status.language} todo={todo} text={text} />
        ) : todo.page === "data" ? (
          <DataPage todo={todo} text={text} />
        ) : (
          <ThemePage rhythm={rhythm} text={text} />
        )}
      </section>
    </main>
  );
}
