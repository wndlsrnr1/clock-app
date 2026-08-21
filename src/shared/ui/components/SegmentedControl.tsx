export interface SegmentedControlOption<TValue extends string> {
  label: string;
  value: TValue;
  ariaLabel?: string;
}

interface SegmentedControlProps<TValue extends string> {
  ariaLabel: string;
  options: Array<SegmentedControlOption<TValue>>;
  value: TValue;
  onChange(value: TValue): void | Promise<void>;
}

export function SegmentedControl<TValue extends string>({
  ariaLabel,
  onChange,
  options,
  value,
}: SegmentedControlProps<TValue>): React.JSX.Element {
  return (
    <div className="segmented-control" aria-label={ariaLabel}>
      {options.map((option: SegmentedControlOption<TValue>): React.JSX.Element => (
        <button
          aria-label={option.ariaLabel}
          aria-pressed={option.value === value}
          className={option.value === value ? "segmented-control-button active" : "segmented-control-button"}
          key={option.value}
          onClick={() => void onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
