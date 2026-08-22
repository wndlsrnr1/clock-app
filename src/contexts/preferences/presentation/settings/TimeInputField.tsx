import { TimePickerField } from "../../../../shared/ui/components/TimePickerField";
import type { TextCatalog } from "../../../../shared/i18n/catalog";

interface TimeInputFieldProps {
  label: string;
  text: TextCatalog;
  value: string;
  onChange(value: string): void;
}

export function TimeInputField({ label, onChange, text, value }: TimeInputFieldProps): React.JSX.Element {
  return <TimePickerField label={label} onChange={onChange} required={true} showLabel={true} text={text.timePicker} value={value} />;
}
