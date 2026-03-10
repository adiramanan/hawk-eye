import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface SelectInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function SelectInput({ definition, snapshot, onChange }: SelectInputProps) {
  const options = definition.options ?? [];
  const hasCurrentOption = options.some((option) => option.value === snapshot.inputValue);
  const renderedOptions = hasCurrentOption
    ? options
    : [{ label: snapshot.inputValue || definition.placeholder, value: snapshot.inputValue }, ...options];

  return (
    <select
      aria-label={definition.label}
      data-hawk-eye-control={definition.id}
      data-hawk-eye-ui="select-input"
      onChange={(event) => onChange(event.currentTarget.value)}
      value={snapshot.inputValue}
    >
      {renderedOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
