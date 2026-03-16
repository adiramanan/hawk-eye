import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface SelectInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function SelectInput({ definition, snapshot, onChange }: SelectInputProps) {
  const options = definition.options ?? [];
  const effectiveValue = snapshot.inputValue || snapshot.baseline;
  const hasCurrentOption = options.some((option) => option.value === effectiveValue);
  const fallbackLabel = (() => {
    const raw = effectiveValue || definition.placeholder;
    // CSS font stacks contain commas — show only the primary font name
    if (raw.includes(',')) return raw.split(',')[0].trim().replace(/["']/g, '');
    return raw;
  })();
  const renderedOptions = hasCurrentOption
    ? options
    : [{ label: fallbackLabel, value: effectiveValue }, ...options];

  return (
    <select
      aria-label={definition.label}
      data-hawk-eye-control={definition.id}
      data-hawk-eye-ui="select-input"
      onChange={(event) => onChange(event.currentTarget.value)}
      value={effectiveValue}
    >
      {renderedOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
