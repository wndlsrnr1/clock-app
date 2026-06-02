import type { TextCatalog } from "../textCatalog";
import { TimePickerField } from "./TimePickerField";

interface TimeInputFieldProps {
  label: string;
  text: TextCatalog;
  value: string;
  onChange(value: string): void;
}

export function TimeInputField({ label, onChange, text, value }: TimeInputFieldProps): React.JSX.Element {
  return <TimePickerField label={label} onChange={onChange} required={true} showLabel={true} text={text} value={value} />;
}
