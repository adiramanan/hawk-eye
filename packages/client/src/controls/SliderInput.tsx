import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface SliderInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function SliderInput({ definition, snapshot, onChange }: SliderInputProps) {
  return (
    <div data-hawk-eye-ui="opacity-row">
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="range-input"
        max={String(definition.max ?? 1)}
        min={String(definition.min ?? 0)}
        onChange={(event) => onChange(event.currentTarget.value)}
        step={String(definition.step ?? 0.01)}
        type="range"
        value={snapshot.invalid ? snapshot.value : snapshot.inputValue || snapshot.baseline || '0'}
      />
      <input
        aria-label={`${definition.label} value`}
        data-hawk-eye-control={`${definition.id}-number`}
        data-hawk-eye-ui="text-input"
        inputMode="decimal"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={definition.placeholder}
        type="number"
        value={snapshot.inputValue || snapshot.baseline}
      />
    </div>
  );
}
