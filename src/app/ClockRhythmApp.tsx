import { CalendarPage } from "../contexts/todo/presentation/calendar/CalendarPage";
import { DataPage } from "../features/data-transfer/presentation/DataPage";
import { useDataTransfer } from "../features/data-transfer/presentation/useDataTransfer";
import { SegmentedControl } from "../ui/components/SegmentedControl";
import { ThemePage } from "../contexts/preferences/presentation/theme/ThemePage";
import { usePreferencesApp } from "../contexts/preferences/presentation/usePreferencesApp";
import { createTranslator } from "../ui/textCatalog";
import { useLayoutMode } from "../ui/useLayoutMode";
import { useRhythmApp } from "../contexts/rhythm/presentation/useRhythmApp";
import { useTodoApp } from "../contexts/todo/presentation/useTodoApp";
import type { AppModules } from "./contracts/AppModules";
import type { UserPreferencesSnapshot } from "../contexts/preferences/public";
import { useAppNavigation } from "./navigation/useAppNavigation";
import { ClockPage } from "./pages/ClockPage";

interface ClockRhythmAppProps {
  modules: AppModules;
  initialNow?: Date;
  initialPreferences: UserPreferencesSnapshot;
}

export function ClockRhythmApp({ modules, initialNow = new Date(), initialPreferences }: ClockRhythmAppProps): React.JSX.Element {
  const navigation = useAppNavigation();
  const rhythm = useRhythmApp(modules.rhythm, initialNow);
  const preferences = usePreferencesApp(
    modules.preferences,
    initialPreferences,
  );
  const text = createTranslator(preferences.preferences.language);
  const todo = useTodoApp(modules, rhythm.now, text);
  const dataTransfer = useDataTransfer(modules.dataTransfer, text, async (): Promise<void> => {
    await preferences.refresh();
    await todo.refresh();
  });
  const { containerRef, layoutMode } = useLayoutMode();

  return (
    <main className="app-shell" data-theme={preferences.preferences.theme} ref={containerRef}>
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
            onChange={preferences.changeLanguage}
            options={[
              { ariaLabel: text.language.korName, label: text.language.kor, value: "kor" },
              { ariaLabel: text.language.enName, label: text.language.en, value: "en" },
            ]}
            value={preferences.preferences.language}
          />
        </nav>
        {navigation.page === "clock" ? (
          <ClockPage preferences={preferences} rhythm={rhythm} text={text} todo={todo} />
        ) : navigation.page === "calendar" ? (
          <CalendarPage language={preferences.preferences.language} todo={todo} text={text} />
        ) : navigation.page === "data" ? (
          <DataPage dataTransfer={dataTransfer} text={text} />
        ) : (
          <ThemePage preferences={preferences} text={text} />
        )}
      </section>
    </main>
  );
}
