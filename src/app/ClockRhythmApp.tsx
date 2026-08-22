import { CalendarPage, useTodoApp } from "../contexts/todo/public-presentation";
import { DataPage, useDataTransfer } from "../features/data-transfer/public-presentation";
import { SegmentedControl } from "../shared/ui/components/SegmentedControl";
import { ThemePage, usePreferencesApp } from "../contexts/preferences/public-presentation";
import { createTranslator } from "../shared/i18n/catalog";
import { useLayoutMode } from "../shared/ui/layout/useLayoutMode";
import { useRhythmApp } from "../contexts/rhythm/public-presentation";
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
  const preferences = usePreferencesApp(
    modules.preferences,
    initialPreferences,
  );
  const text = createTranslator(preferences.preferences.language);
  const rhythm = useRhythmApp(modules.rhythm, initialNow, text);
  const todo = useTodoApp(modules.todo, rhythm.now, text);
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
