import { parseCssValue } from '../utils/css-value';
import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface NumberInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

function isKeywordUnit(unit: string) {
  return parseCssValue(`1${unit}`) === null;
}

function isCompleteNumericInput(rawValue: string) {
  return /^-?(?:\d+|\d*\.\d+)$/.test(rawValue.trim());
}

function getFirstNumericUnit(units: string[]) {
  return units.find((unit) => !isKeywordUnit(unit)) ?? '';
}

function getSelectedUnit(
  value: string,
  units: string[],
  defaultUnit: string | undefined,
  fallbackValue: string
) {
  const trimmed = value.trim();

  if (trimmed && units.includes(trimmed)) {
    return trimmed;
  }

  const parsed = parseCssValue(trimmed);

  if (parsed?.unit && units.includes(parsed.unit)) {
    return parsed.unit;
  }

  const fallbackParsed = parseCssValue(fallbackValue.trim());

  if (fallbackParsed?.unit && units.includes(fallbackParsed.unit)) {
    return fallbackParsed.unit;
  }

  if (defaultUnit && units.includes(defaultUnit)) {
    return defaultUnit;
  }

  return getFirstNumericUnit(units) || units[0];
}

function getDisplayedValue(value: string, selectedUnit: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  if (trimmed === selectedUnit && isKeywordUnit(selectedUnit)) {
    return '';
  }

  const parsed = parseCssValue(trimmed);

  if (!parsed) {
    return value;
  }

  return String(parsed.number);
}

export function NumberInput({ definition, snapshot, onChange }: NumberInputProps) {
  const units = definition.units ?? [];

  if (units.length === 0) {
    return (
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="text-input"
        inputMode="decimal"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={definition.placeholder}
        type="text"
        value={snapshot.inputValue}
      />
    );
  }

  const fallbackValue = snapshot.invalid ? snapshot.value : snapshot.inputValue;
  const selectedUnit = getSelectedUnit(
    snapshot.inputValue,
    units,
    definition.defaultUnit,
    fallbackValue
  );
  const keywordMode =
    isKeywordUnit(selectedUnit) && snapshot.inputValue.trim() === selectedUnit;

  function handleValueChange(rawValue: string) {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      onChange(rawValue);
      return;
    }

    if (isCompleteNumericInput(trimmed) && !isKeywordUnit(selectedUnit)) {
      onChange(`${trimmed}${selectedUnit}`);
      return;
    }

    onChange(rawValue);
  }

  function handleUnitChange(nextUnit: string) {
    if (isKeywordUnit(nextUnit)) {
      onChange(nextUnit);
      return;
    }

    const parsedCurrentValue = parseCssValue(snapshot.inputValue.trim());
    const parsedLastValidValue = parseCssValue(snapshot.value.trim());
    const parsedBaselineValue = parseCssValue(snapshot.baseline.trim());

    if (parsedCurrentValue) {
      onChange(`${parsedCurrentValue.number}${nextUnit}`);
      return;
    }

    if (isCompleteNumericInput(snapshot.inputValue)) {
      onChange(`${snapshot.inputValue.trim()}${nextUnit}`);
      return;
    }

    if (parsedLastValidValue) {
      onChange(`${parsedLastValidValue.number}${nextUnit}`);
      return;
    }

    if (parsedBaselineValue) {
      onChange(`${parsedBaselineValue.number}${nextUnit}`);
      return;
    }

    onChange(`0${nextUnit}`);
  }

  return (
    <div data-hawk-eye-ui="number-input-row">
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="text-input"
        disabled={keywordMode}
        inputMode="decimal"
        onChange={(event) => handleValueChange(event.currentTarget.value)}
        placeholder={keywordMode ? selectedUnit : definition.placeholder}
        type="text"
        value={getDisplayedValue(snapshot.inputValue, selectedUnit)}
      />
      <select
        aria-label={`${definition.label} unit`}
        data-hawk-eye-control={`${definition.id}-unit`}
        data-hawk-eye-ui="select-input"
        onChange={(event) => handleUnitChange(event.currentTarget.value)}
        value={selectedUnit}
      >
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  );
}
