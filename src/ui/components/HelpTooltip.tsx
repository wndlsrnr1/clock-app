interface HelpTooltipProps {
  description: string;
  id: string;
  label: string;
}

export function HelpTooltip({ description, id, label }: HelpTooltipProps): React.JSX.Element {
  return (
    <span className="help-tooltip-wrap">
      <button aria-describedby={id} aria-label={label} className="help-dot" type="button">?</button>
      <span className="help-tooltip" id={id} role="tooltip">{description}</span>
    </span>
  );
}
