import { useId, useState } from "react";
import type { RhythmSettingsSummary } from "../rhythmSettingsSummary";
import type { TextCatalog } from "../textCatalog";

interface RhythmSettingsDisclosureProps {
  children: React.ReactNode;
  summary: RhythmSettingsSummary;
  text: TextCatalog;
}

export function RhythmSettingsDisclosure({ children, summary, text }: RhythmSettingsDisclosureProps): React.JSX.Element {
  const contentId = useId();
  const [expanded, setExpanded] = useState(summary.shouldOpenOnInitialRender);

  return (
    <section className="settings-disclosure" aria-labelledby={`${contentId}-title`}>
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        className="settings-disclosure__button"
        onClick={() => setExpanded((current: boolean): boolean => !current)}
        type="button"
      >
        <span className="settings-disclosure__main">
          <span className="settings-disclosure__title" id={`${contentId}-title`}>{text.rhythm.disclosure.title}</span>
          <span className="settings-disclosure__summary">{summary.text}</span>
        </span>
        <span className="settings-disclosure__right">
          <span className="settings-disclosure__chips" aria-label={text.rhythm.disclosure.title}>
            {summary.chips.map((chip: string): React.JSX.Element => (
              <span className="summary-chip" key={chip}>{chip}</span>
            ))}
          </span>
          <span aria-hidden="true" className="settings-disclosure__chevron">{expanded ? "▴" : "▾"}</span>
          <span className="sr-only">{expanded ? text.rhythm.disclosure.collapse : text.rhythm.disclosure.expand}</span>
        </span>
      </button>
      {expanded ? (
        <div className="settings-disclosure__content" id={contentId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
