import { TimePickerField } from "../../../../ui/components/TimePickerField";
import type { TextCatalog } from "../../../../ui/textCatalog";

interface TimeInputFieldProps {
  label: string;
  text: TextCatalog;
  value: string;
  onChange(value: string): void;
}

export function TimeInputField({ label, onChange, text, value }: TimeInputFieldProps): React.JSX.Element {
  return <TimePickerField label={label} onChange={onChange} required={true} showLabel={true} text={text} value={value} />;
}
