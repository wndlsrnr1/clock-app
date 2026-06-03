import type { RhythmAppViewModel } from "../useRhythmApp";
import type { TextCatalog } from "../textCatalog";
import { themeOptions, type ThemeOption } from "../themeCatalog";

interface ThemePageProps {
  rhythm: RhythmAppViewModel;
  text: TextCatalog;
}

export function ThemePage({ rhythm, text }: ThemePageProps): React.JSX.Element {
  return (
    <section className="theme-page" aria-labelledby="theme-page-title">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">{text.theme.eyebrow}</p>
          <h2 id="theme-page-title">{text.theme.title}</h2>
        </div>
      </div>
      <p className="panel-copy">{text.theme.description}</p>
      <div className="theme-grid">
        {themeOptions.map((theme: ThemeOption): React.JSX.Element => {
          const selected = rhythm.status.theme === theme.id;

          return (
            <button
              aria-label={`${theme.name} ${text.theme.select}`}
              aria-pressed={selected}
              className={selected ? "theme-card selected" : "theme-card"}
              key={theme.id}
              onClick={() => void rhythm.changeTheme(theme.id)}
              type="button"
            >
              <span className="theme-card__header">
                <span className="theme-card__name">{theme.id === "current" ? text.theme.currentName : theme.name}</span>
                {selected ? <span className="theme-card__selected">{text.theme.selected}</span> : null}
              </span>
              <span className="theme-card__swatches" aria-hidden="true">
                {theme.swatches.map((swatch: string): React.JSX.Element => (
                  <span className="theme-card__swatch" key={swatch} style={{ background: swatch }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {rhythm.message ? <p className="status-message">{rhythm.message}</p> : null}
    </section>
  );
}
