import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { getNextGroupIndex, isGroupNavigationKey } from '../utils/keyboard-navigation';

interface SegmentedControlProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function SegmentedControl({ definition, snapshot, onChange }: SegmentedControlProps) {
  const options = definition.options ?? [];
  const effectiveValue = snapshot.inputValue || snapshot.baseline;

  return (
    <div data-hawk-eye-ui="segmented-row">
      {options.map((opt, index) => (
        <button
          aria-label={opt.label}
          data-active={effectiveValue === opt.value ? 'true' : 'false'}
          data-hawk-eye-control={`${definition.id}-${opt.value}`}
          data-hawk-eye-ui="segmented-button"
          key={opt.value}
          onKeyDown={(event) => {
            if (!isGroupNavigationKey(event.key)) {
              return;
            }

            event.preventDefault();

            const nextIndex = getNextGroupIndex(event.key, index, options.length);
            const nextOption = options[nextIndex];

            if (!nextOption) {
              return;
            }

            onChange(nextOption.value);
            const buttons =
              event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>(
                'button'
              );
            buttons?.[nextIndex]?.focus();
          }}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
