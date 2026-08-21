import { CalendarPage } from "../ui/components/CalendarPage";
import { DataPage } from "../ui/components/DataPage";
import { SegmentedControl } from "../ui/components/SegmentedControl";
import { ThemePage } from "../ui/components/ThemePage";
import { useLayoutMode } from "../ui/useLayoutMode";
import { useRhythmApp } from "../ui/useRhythmApp";
import { useTodoApp } from "../ui/useTodoApp";
import type { AppModules } from "./contracts/AppModules";
import { useAppNavigation } from "./navigation/useAppNavigation";
import { ClockPage } from "./pages/ClockPage";

interface ClockRhythmAppProps {
  modules: AppModules;
  initialNow?: Date;
}

export function ClockRhythmApp({ modules, initialNow = new Date() }: ClockRhythmAppProps): React.JSX.Element {
  const navigation = useAppNavigation();
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
            onChange={navigation.show}
            options={[
              { label: text.navigation.clock, value: "clock" },
              { label: text.navigation.calendar, value: "calendar" },
              { label: text.navigation.data, value: "data" },
              { label: text.navigation.theme, value: "theme" },
            ]}
            value={navigation.page}
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
        {navigation.page === "clock" ? (
          <ClockPage rhythm={rhythm} text={text} todo={todo} />
        ) : navigation.page === "calendar" ? (
          <CalendarPage language={rhythm.status.language} todo={todo} text={text} />
        ) : navigation.page === "data" ? (
          <DataPage todo={todo} text={text} />
        ) : (
          <ThemePage rhythm={rhythm} text={text} />
        )}
      </section>
    </main>
  );
}
