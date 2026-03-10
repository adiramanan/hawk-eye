import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface TextInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function TextInput({ definition, snapshot, onChange }: TextInputProps) {
  return (
    <input
      aria-label={definition.label}
      data-hawk-eye-control={definition.id}
      data-hawk-eye-ui="text-input"
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={definition.placeholder}
      type="text"
      value={snapshot.inputValue}
    />
  );
}
