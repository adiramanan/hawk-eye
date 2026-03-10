import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface ToggleSwitchProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function ToggleSwitch({ definition, snapshot, onChange }: ToggleSwitchProps) {
  return (
    <div data-hawk-eye-ui="toggle-row">
      {(definition.options ?? []).map((opt) => (
        <button
          aria-label={opt.label}
          data-active={snapshot.inputValue === opt.value ? 'true' : 'false'}
          data-hawk-eye-control={`${definition.id}-${opt.value}`}
          data-hawk-eye-ui="toggle-button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
