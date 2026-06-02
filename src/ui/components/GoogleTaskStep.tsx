import { HelpTooltip } from "./HelpTooltip";

interface GoogleTaskStepProps {
  children: React.ReactNode;
  description: string;
  helpId: string;
  helpLabel: string;
  title: string;
}

export function GoogleTaskStep({ children, description, helpId, helpLabel, title }: GoogleTaskStepProps): React.JSX.Element {
  return (
    <section className="google-step" aria-label={title}>
      <div className="google-step-header">
        <span className="google-step-title">{title}</span>
      </div>
      {children}
      <HelpTooltip description={description} id={helpId} label={helpLabel} />
    </section>
  );
}
