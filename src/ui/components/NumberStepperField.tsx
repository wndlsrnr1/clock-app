import { useId } from "react";
import { formatText, type TextCatalog } from "../textCatalog";
import { IconButton } from "./IconButton";

interface NumberStepperFieldProps {
  label: string;
  max: number;
  min: number;
  value: number;
  text: TextCatalog;
  onChange(value: number): void;
}

export function NumberStepperField({
  label,
  max,
  min,
  onChange,
  text,
  value,
}: NumberStepperFieldProps): React.JSX.Element {
  const inputId = useId();

  return (
    <div>
      <label className="label" htmlFor={inputId}>{label}</label>
      <span className="number-stepper">
        <IconButton
          icon="minus"
          label={formatText(text.rhythm.settings.decrease, { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          variant="subtle"
        />
        <input
          aria-label={label}
          id={inputId}
          inputMode="numeric"
          max={max}
          min={min}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
          type="number"
          value={value}
        />
        <IconButton
          icon="plus"
          label={formatText(text.rhythm.settings.increase, { label })}
          onClick={() => onChange(Math.min(max, value + 1))}
          variant="subtle"
        />
      </span>
    </div>
  );
}
