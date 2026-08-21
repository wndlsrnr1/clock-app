import { useId, useState } from "react";
import { IconButton } from "../../../../ui/components/IconButton";
import { validateMinuteInput } from "../../../../ui/inputValidation";
import { formatText, type TextCatalog } from "../../../../ui/textCatalog";

interface NumberStepperFieldProps {
  label: string;
  max: number;
  min: number;
  value: number;
  text: TextCatalog;
  onChange(value: number): void;
}

interface NumberStepperDraft {
  committedValue: number;
  value: string;
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
  const hintId = useId();
  const [draftState, setDraftState] = useState<NumberStepperDraft>({ committedValue: value, value: String(value) });
  const draft = draftState.committedValue === value ? draftState.value : String(value);
  const validation = validateMinuteInput(draft, min, max, text);

  const commitDraft = (): void => {
    if (!validation.isValid) {
      setDraftState({ committedValue: value, value: String(value) });
      return;
    }

    const nextValue = Number(draft);
    setDraftState({ committedValue: nextValue, value: draft });
    onChange(nextValue);
  };

  return (
    <div>
      <div className="field-label-row">
        <label className="label" htmlFor={inputId}>{label}</label>
        <span className="field-meta-pill">{validation.meta}</span>
      </div>
      <span className="number-stepper">
        <IconButton
          icon="minus"
          disabled={value <= min}
          label={formatText(text.rhythm.settings.decrease, { label })}
          onClick={() => onChange(Math.max(min, value - 1))}
          variant="subtle"
        />
        <input
          aria-describedby={hintId}
          aria-invalid={!validation.isValid}
          aria-label={label}
          id={inputId}
          inputMode="numeric"
          max={max}
          min={min}
          onBlur={commitDraft}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraftState({ committedValue: value, value: event.target.value.replace(/\D/g, "") })}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }
          }}
          type="text"
          value={draft}
        />
        <IconButton
          icon="plus"
          disabled={value >= max}
          label={formatText(text.rhythm.settings.increase, { label })}
          onClick={() => onChange(Math.min(max, value + 1))}
          variant="subtle"
        />
      </span>
      <div className="field-feedback" id={hintId}>
        {validation.error ? <p className="field-error">{validation.error}</p> : null}
      </div>
    </div>
  );
}
