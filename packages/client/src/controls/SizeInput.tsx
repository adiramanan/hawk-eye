import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { parseCssValue } from '../utils/css-value';

interface SizeInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
  label: string; // "W" or "H"
  onModeChange(mode: string): void;
}

type SizeMode = 'fixed' | 'hug' | 'fill' | 'relative';

const SIZE_MODE_OPTIONS: { label: string; value: SizeMode }[] = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Hug', value: 'hug' },
  { label: 'Fill', value: 'fill' },
  { label: 'Relative', value: 'relative' },
];

function getModeFromValue(value: string): SizeMode {
  if (value === 'fit-content') return 'hug';
  if (value === '100%') return 'fill';
  return 'fixed';
}

function getModeLabel(mode: SizeMode): string {
  return SIZE_MODE_OPTIONS.find((opt) => opt.value === mode)?.label || 'Fixed';
}

export function SizeInput({
  definition,
  snapshot,
  onChange,
  label,
  onModeChange,
}: SizeInputProps) {
  const units = definition.units ?? [];

  const value = snapshot.inputValue || snapshot.value;
  const mode = getModeFromValue(value);
  const isNumericMode = mode === 'fixed';

  // Parse numeric value for display
  const parsed = parseCssValue(value.trim());
  const displayNumber = parsed?.number ?? '';
  const selectedUnit = parsed?.unit && units.includes(parsed.unit) ? parsed.unit : (definition.defaultUnit || units[0] || 'px');

  const handleModeChange = (newMode: string) => {
    console.log('[SizeInput] Mode changed to:', newMode);
    onModeChange(newMode);
  };

  const handleValueChange = (newValue: string) => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      onChange(newValue);
      return;
    }
    onChange(`${trimmed}${selectedUnit}`);
  };

  const handleUnitChange = (newUnit: string) => {
    if (displayNumber === '' || displayNumber === 0) {
      onChange(newUnit);
      return;
    }
    onChange(`${displayNumber}${newUnit}`);
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onChange(snapshot.value);
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? (definition.step ?? 1) * 10 : (definition.step ?? 1);
      const base = displayNumber ? Number(displayNumber) : 0;
      let next = e.key === 'ArrowUp' ? base + step : base - step;
      if (definition.min !== undefined) next = Math.max(definition.min, next);
      if (definition.max !== undefined) next = Math.min(definition.max, next);
      onChange(`${next}${selectedUnit}`);
      return;
    }
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div data-hawk-eye-ui="size-input-wrapper">
      {/* Mode selector - using native select for better browser support */}
      <select
        data-hawk-eye-ui="size-input-select"
        value={mode}
        onChange={(e) => handleModeChange(e.target.value)}
        title={`${label} sizing mode`}
      >
        {SIZE_MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Value and unit inputs when in fixed mode */}
      {isNumericMode && (
        <>
          <input
            aria-label={definition.label}
            data-hawk-eye-control={definition.id}
            data-hawk-eye-ui="size-input-value-input"
            inputMode="decimal"
            onChange={(event) => handleValueChange(event.currentTarget.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={handleNumericKeyDown}
            placeholder={definition.placeholder}
            type="text"
            value={displayNumber}
          />
          {units.length > 0 && (
            <select
              aria-label={`${definition.label} unit`}
              data-hawk-eye-control={`${definition.id}-unit`}
              data-hawk-eye-ui="size-input-unit-select"
              onChange={(event) => handleUnitChange(event.currentTarget.value)}
              value={selectedUnit}
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </div>
  );
}
