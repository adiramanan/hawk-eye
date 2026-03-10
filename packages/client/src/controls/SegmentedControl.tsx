import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface SegmentedControlProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function SegmentedControl({ definition, snapshot, onChange }: SegmentedControlProps) {
  return (
    <div data-hawk-eye-ui="segmented-row">
      {(definition.options ?? []).map((opt) => (
        <button
          aria-label={opt.label}
          data-active={snapshot.inputValue === opt.value ? 'true' : 'false'}
          data-hawk-eye-control={`${definition.id}-${opt.value}`}
          data-hawk-eye-ui="segmented-button"
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
