import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface ColorInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function ColorInput({ definition, snapshot, onChange }: ColorInputProps) {
  return (
    <div data-hawk-eye-ui="color-row">
      <span
        data-hawk-eye-ui="color-swatch"
        style={{ backgroundColor: snapshot.inputValue || 'transparent' }}
      />
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="text-input"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={definition.placeholder}
        type="text"
        value={snapshot.inputValue}
      />
    </div>
  );
}
