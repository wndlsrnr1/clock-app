import { useState } from "react";
import { formatText, type TextCatalog } from "../textCatalog";
import { SvgIcon } from "./SvgIcon";

interface TimePickerFieldProps {
  label: string;
  text: TextCatalog;
  value: string;
  onChange(value: string): void;
  onCancel?: () => void;
  onCommit?: () => void;
  showLabel?: boolean;
}

interface TimeParts {
  hour: string;
  minute: string;
}

const hourOptions: Array<string> = Array.from({ length: 24 }, (_: unknown, hour: number): string => twoDigit(hour));
const minuteOptions: Array<string> = Array.from({ length: 12 }, (_: unknown, index: number): string => twoDigit(index * 5));

export function TimePickerField({
  label,
  onCancel,
  onChange,
  onCommit,
  showLabel = false,
  text,
  value,
}: TimePickerFieldProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTime = parsedTimeParts(value);
  const directInputLabel = formatText(text.todo.timePicker.directInput, { label });
  const displayValue = displayTimeValue(value);
  const directDisplay = displayDirectInputValue(value);

  return (
    <div className={showLabel ? "time-picker-field with-label" : "time-picker-field"}>
      {showLabel ? <span className="label">{label}</span> : null}
      <div className="time-picker-control">
        <button
          aria-expanded={isOpen}
          aria-label={label}
          className="time-picker-trigger"
          onClick={() => setIsOpen((current: boolean): boolean => !current)}
          onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
            event.stopPropagation();
          }}
          type="button"
        >
          <SvgIcon name="clock" />
          <span>{displayValue || text.todo.timePicker.placeholder}</span>
        </button>
        {isOpen ? (
          <div
            aria-label={label}
            aria-modal="true"
            className="time-picker-modal"
            onClick={() => setIsOpen(false)}
            role="dialog"
          >
            <div className="time-picker-dialog" onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
              <label className="time-picker-direct">
                <span>{text.todo.timePicker.directLabel}</span>
                <span className="time-picker-direct-entry">
                  <input
                    aria-label={directInputLabel}
                    inputMode="numeric"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(sanitizeTimeDigits(event.target.value))}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                      if (event.key === "Enter" && onCommit) {
                        event.preventDefault();
                        event.stopPropagation();
                        onCommit();
                        return;
                      }

                      if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        if (onCancel) {
                          onCancel();
                          return;
                        }
                        setIsOpen(false);
                      }
                    }}
                    placeholder="1430"
                    type="text"
                    value={sanitizeTimeDigits(value)}
                  />
                  <span aria-hidden="true" className="time-picker-direct-display">
                    <span className="time-picker-direct-slot">{directDisplay.hour}</span>
                    <span className="time-picker-direct-separator"> : </span>
                    <span className="time-picker-direct-slot">{directDisplay.minute}</span>
                  </span>
                </span>
              </label>
              <div className="time-picker-columns">
                <div aria-label={text.todo.timePicker.hourGroup} className="time-picker-options" role="group">
                  {hourOptions.map((hour: string): React.JSX.Element => (
                    <button
                      aria-pressed={selectedTime?.hour === hour}
                      className={selectedTime?.hour === hour ? "time-picker-option selected" : "time-picker-option"}
                      key={hour}
                      onClick={() => onChange(`${hour}:${selectedTime?.minute ?? "00"}`)}
                      type="button"
                    >
                      {formatText(text.todo.timePicker.hourOption, { hour })}
                    </button>
                  ))}
                </div>
                <div aria-label={text.todo.timePicker.minuteGroup} className="time-picker-options" role="group">
                  {minuteOptions.map((minute: string): React.JSX.Element => (
                    <button
                      aria-pressed={selectedTime?.minute === minute}
                      className={selectedTime?.minute === minute ? "time-picker-option selected" : "time-picker-option"}
                      key={minute}
                      onClick={() => onChange(`${selectedTime?.hour ?? "00"}:${minute}`)}
                      type="button"
                    >
                      {formatText(text.todo.timePicker.minuteOption, { minute })}
                    </button>
                  ))}
                </div>
              </div>
              <div className="time-picker-actions">
                <button className="mini-button" onClick={() => onChange("")} type="button">
                  {text.todo.timePicker.clear}
                </button>
                <button className="mini-button" onClick={() => setIsOpen(false)} type="button">
                  {text.todo.timePicker.close}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parsedTimeParts(value: string): TimeParts | null {
  const displayValue = displayTimeValue(value);
  const match = /^(\d{2}):(\d{2})$/.exec(displayValue);

  if (!match) {
    return null;
  }

  return { hour: match[1], minute: match[2] };
}

function twoDigit(value: number): string {
  return String(value).padStart(2, "0");
}

function sanitizeTimeDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function displayTimeValue(value: string): string {
  const digits = sanitizeTimeDigits(value);

  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return digits;
}

function displayDirectInputValue(value: string): TimeParts {
  const digits = sanitizeTimeDigits(value);
  const paddedDigits = digits.padEnd(4, "-");

  return { hour: paddedDigits.slice(0, 2), minute: paddedDigits.slice(2) };
}
