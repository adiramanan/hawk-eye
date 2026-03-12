import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { getNextGroupIndex, isGroupNavigationKey } from '../utils/keyboard-navigation';

interface ToggleSwitchProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function ToggleSwitch({ definition, snapshot, onChange }: ToggleSwitchProps) {
  const options = definition.options ?? [];

  return (
    <div data-hawk-eye-ui="toggle-row">
      {options.map((opt, index) => (
        <button
          aria-label={opt.label}
          data-active={snapshot.inputValue === opt.value ? 'true' : 'false'}
          data-hawk-eye-control={`${definition.id}-${opt.value}`}
          data-hawk-eye-ui="toggle-button"
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
