import type React from 'react';
import { useScrub } from '../hooks';
import { formatCssValue, parseCssValue } from '../utils/css-value';
import type { EditablePropertyDefinition, PropertySnapshot } from '../types';

interface NumberInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
  /** Short label rendered as a scrub handle (e.g. "W", "H"). If omitted, no scrub handle. */
  scrubLabel?: string;
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

/** Safely evaluate a math expression string. Returns null if invalid. */
function evalMathExpr(expr: string): number | null {
  const cleaned = expr.replace(/[^0-9+\-*/(). ]/g, '').trim();
  if (!cleaned) return null;
  try {
    const result = new Function(`"use strict"; return (${cleaned})`)() as unknown;
    if (typeof result === 'number' && isFinite(result)) return result;
  } catch {
    // ignore
  }
  return null;
}

function hasMathOperator(value: string) {
  // Has an operator but isn't just a negative sign at the start
  return /(?<=[0-9)])[+\-*/]/.test(value) || /^[0-9]+[+\-*/]/.test(value);
}

interface ScrubNumberInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
  scrubLabel: string;
  selectedUnit: string;
  keywordMode: boolean;
  displayedValue: string;
  onValueChange(rawValue: string): void;
  onUnitChange(nextUnit: string): void;
}

function ScrubNumberInput({
  definition,
  snapshot,
  scrubLabel,
  selectedUnit,
  keywordMode,
  displayedValue,
  onValueChange,
  onUnitChange,
  onChange,
}: ScrubNumberInputProps) {
  const units = definition.units ?? [];
  const hasSingleUnit = units.length === 1;
  const parsed = parseCssValue(snapshot.inputValue.trim()) ?? parseCssValue(snapshot.value.trim());
  const currentNumber = parsed?.number ?? 0;

  const { labelProps, isScrubbing } = useScrub({
    value: currentNumber,
    step: definition.step ?? 1,
    min: definition.min,
    max: definition.max,
    onChange: (next) => {
      const rounded = definition.step && definition.step < 1
        ? Number(next.toFixed(String(definition.step).split('.')[1]?.length ?? 2))
        : Math.round(next);
      onChange(formatCssValue(rounded, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
    },
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onChange(snapshot.value);
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? (definition.step ?? 1) * 10 : (definition.step ?? 1);
      const base = parseCssValue(snapshot.inputValue.trim())?.number
        ?? parseCssValue(snapshot.value.trim())?.number
        ?? 0;
      let next = e.key === 'ArrowUp' ? base + step : base - step;
      if (definition.min !== undefined) next = Math.max(definition.min, next);
      if (definition.max !== undefined) next = Math.min(definition.max, next);
      const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 2 : 0;
      next = Number(next.toFixed(decimals));
      onChange(formatCssValue(next, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
      return;
    }
    if (e.key === 'Enter') {
      const raw = snapshot.inputValue;
      if (hasMathOperator(raw)) {
        const result = evalMathExpr(raw);
        if (result !== null) {
          onChange(formatCssValue(result, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
        }
      }
      e.currentTarget.blur();
    }
  }

  function handleBlur() {
    const raw = snapshot.inputValue;
    if (hasMathOperator(raw)) {
      const result = evalMathExpr(raw);
      if (result !== null) {
        onChange(formatCssValue(result, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
      }
    }
  }

  return (
    <div data-hawk-eye-ui="number-input-with-scrub" data-scrubbing={isScrubbing ? 'true' : 'false'}>
      <span {...labelProps}>{scrubLabel}</span>
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="text-input"
        disabled={keywordMode}
        inputMode="decimal"
        onBlur={handleBlur}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={handleKeyDown}
        placeholder={keywordMode ? selectedUnit : definition.placeholder}
        type="text"
        value={displayedValue}
      />
      {units.length > 0 && !hasSingleUnit && (
        <select
          aria-label={`${definition.label} unit`}
          data-hawk-eye-control={`${definition.id}-unit`}
          data-hawk-eye-ui="select-input"
          onChange={(event) => onUnitChange(event.currentTarget.value)}
          value={selectedUnit}
        >
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      )}
      {hasSingleUnit && (
        <span data-hawk-eye-ui="input-unit-label">{selectedUnit}</span>
      )}
    </div>
  );
}

export function NumberInput({ definition, snapshot, onChange, scrubLabel }: NumberInputProps) {
  const units = definition.units ?? [];
  const hasSingleUnit = units.length === 1;

  if (units.length === 0 && !scrubLabel) {
    return (
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="text-input"
        inputMode="decimal"
        onChange={(event) => onChange(event.currentTarget.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange(snapshot.value);
            e.currentTarget.blur();
            return;
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? (definition.step ?? 1) * 10 : (definition.step ?? 1);
            const base = parseCssValue(snapshot.inputValue.trim())?.number ?? 0;
            let next = e.key === 'ArrowUp' ? base + step : base - step;
            if (definition.min !== undefined) next = Math.max(definition.min, next);
            if (definition.max !== undefined) next = Math.min(definition.max, next);
            onChange(String(next));
            return;
          }
          if (e.key === 'Enter') {
            if (hasMathOperator(snapshot.inputValue)) {
              const result = evalMathExpr(snapshot.inputValue);
              if (result !== null) onChange(String(result));
            }
            e.currentTarget.blur();
          }
        }}
        onBlur={() => {
          if (hasMathOperator(snapshot.inputValue)) {
            const result = evalMathExpr(snapshot.inputValue);
            if (result !== null) onChange(String(result));
          }
        }}
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
  const displayedValue = getDisplayedValue(snapshot.inputValue, selectedUnit);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onChange(snapshot.value);
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? (definition.step ?? 1) * 10 : (definition.step ?? 1);
      const base = parseCssValue(snapshot.inputValue.trim())?.number
        ?? parseCssValue(snapshot.value.trim())?.number
        ?? 0;
      let next = e.key === 'ArrowUp' ? base + step : base - step;
      if (definition.min !== undefined) next = Math.max(definition.min, next);
      if (definition.max !== undefined) next = Math.min(definition.max, next);
      const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 2 : 0;
      next = Number(next.toFixed(decimals));
      onChange(formatCssValue(next, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
      return;
    }
    if (e.key === 'Enter') {
      const raw = snapshot.inputValue;
      if (hasMathOperator(raw)) {
        const result = evalMathExpr(raw);
        if (result !== null) {
          onChange(formatCssValue(result, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
        }
      }
      e.currentTarget.blur();
    }
  }

  function handleBlur() {
    const raw = snapshot.inputValue;
    if (hasMathOperator(raw)) {
      const result = evalMathExpr(raw);
      if (result !== null) {
        onChange(formatCssValue(result, isKeywordUnit(selectedUnit) ? (definition.defaultUnit ?? 'px') : selectedUnit));
      }
    }
  }

  if (scrubLabel) {
    return (
      <ScrubNumberInput
        definition={definition}
        displayedValue={displayedValue}
        keywordMode={keywordMode}
        onChange={onChange}
        onUnitChange={handleUnitChange}
        onValueChange={handleValueChange}
        scrubLabel={scrubLabel}
        selectedUnit={selectedUnit}
        snapshot={snapshot}
      />
    );
  }

  return (
    <div data-hawk-eye-ui="number-input-row">
      <input
        aria-label={definition.label}
        data-hawk-eye-control={definition.id}
        data-hawk-eye-ui="text-input"
        disabled={keywordMode}
        inputMode="decimal"
        onBlur={handleBlur}
        onChange={(event) => handleValueChange(event.currentTarget.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={handleKeyDown}
        placeholder={keywordMode ? selectedUnit : definition.placeholder}
        type="text"
        value={displayedValue}
      />
      {units.length > 0 && !hasSingleUnit && (
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
      )}
      {hasSingleUnit && (
        <span data-hawk-eye-ui="input-unit-label">{selectedUnit}</span>
      )}
    </div>
  );
}
