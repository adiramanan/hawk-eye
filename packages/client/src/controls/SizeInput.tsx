import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { getSizeUnitsForMode, isNumericSizeMode } from '../size-state';
import type { EditablePropertyDefinition, PropertySnapshot, SizeMode } from '../types';
import { parseCssValue } from '../utils/css-value';

interface SizeInputProps {
  definition: EditablePropertyDefinition;
  label: string;
  mode: SizeMode;
  onChange(value: string): void;
  onModeChange(mode: SizeMode): void;
  snapshot: PropertySnapshot;
}

type OpenMenu = 'mode' | null;

const SIZE_MODE_OPTIONS: Array<{ label: string; value: SizeMode }> = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Hug', value: 'hug' },
  { label: 'Fill', value: 'fill' },
  { label: 'Relative', value: 'relative' },
];

const SIZE_MODE_LABELS: Record<SizeMode, string> = {
  fixed: 'Fixed',
  hug: 'Hug',
  fill: 'Fill',
  relative: 'Relative',
};

function ChevronIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.25 4.75L6 7.5L8.75 4.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function getAxis(definition: EditablePropertyDefinition) {
  return definition.id === 'height' ? 'height' : 'width';
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

  return units[0] ?? 'px';
}

function getDisplayedValue(value: string, selectedUnit: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === selectedUnit) {
    return '';
  }

  const parsed = parseCssValue(trimmed);

  if (!parsed) {
    return /^-?(?:\d+|\d*\.\d+)$/.test(trimmed) ? trimmed : '';
  }

  return String(parsed.number);
}

export function SizeInput({
  definition,
  label,
  mode,
  onChange,
  onModeChange,
  snapshot,
}: SizeInputProps) {
  const axis = getAxis(definition);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const value = snapshot.inputValue || snapshot.value;
  const numericMode = isNumericSizeMode(mode);
  const units = getSizeUnitsForMode(axis, mode, value.trim());
  const fallbackValue = snapshot.invalid ? snapshot.value : snapshot.inputValue;
  const selectedUnit = getSelectedUnit(
    snapshot.inputValue,
    units,
    definition.defaultUnit,
    fallbackValue
  );
  const displayedValue = getDisplayedValue(snapshot.inputValue, selectedUnit);
  const numericUnit = selectedUnit;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;

      if (!root || event.composedPath().includes(root)) {
        return;
      }

      setOpenMenu(null);
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleValueChange(rawValue: string) {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      onChange(rawValue);
      return;
    }

    onChange(`${trimmed}${numericUnit}`);
  }

  function handleNumericKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      onChange(snapshot.value);
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const step = event.shiftKey ? (definition.step ?? 1) * 10 : definition.step ?? 1;
      const base =
        parseCssValue(snapshot.inputValue.trim())?.number ??
        parseCssValue(snapshot.value.trim())?.number ??
        0;
      let next = event.key === 'ArrowUp' ? base + step : base - step;

      if (definition.min !== undefined) next = Math.max(definition.min, next);
      if (definition.max !== undefined) next = Math.min(definition.max, next);

      const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 2 : 0;
      onChange(`${Number(next.toFixed(decimals))}${numericUnit}`);
      return;
    }

    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }

  function toggleMenu(nextMenu: 'mode') {
    setOpenMenu((current) => (current === nextMenu ? null : nextMenu));
  }

  function handleModeSelect(nextMode: SizeMode) {
    setOpenMenu(null);
    onModeChange(nextMode);
  }

  function preventSelection(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div data-hawk-eye-ui="size-input-wrapper" data-mode={mode} ref={rootRef}>
      <div data-hawk-eye-ui="size-input-pill">
        <span data-hawk-eye-ui="size-input-label">{label}</span>
        {numericMode ? (
          <>
            <input
              aria-label={definition.label}
              data-hawk-eye-control={definition.id}
              data-hawk-eye-ui="size-input-value-input"
              inputMode="decimal"
              onChange={(event) => handleValueChange(event.currentTarget.value)}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={handleNumericKeyDown}
              placeholder={definition.placeholder}
              type="text"
              value={displayedValue}
            />
            <span data-hawk-eye-ui="size-input-unit-text">
              {selectedUnit}
            </span>
            <button
              aria-expanded={openMenu === 'mode'}
              aria-haspopup="menu"
              aria-label={`${definition.label} mode`}
              data-hawk-eye-control={`${definition.id}-mode`}
              data-hawk-eye-ui="size-input-menu-button"
              data-value={mode}
              onClick={() => toggleMenu('mode')}
              onPointerDown={preventSelection}
              type="button"
            >
              <ChevronIcon />
            </button>
          </>
        ) : (
          <button
            aria-expanded={openMenu === 'mode'}
            aria-haspopup="menu"
            aria-label={`${definition.label} mode`}
            data-hawk-eye-control={`${definition.id}-mode`}
            data-hawk-eye-ui="size-input-token-trigger"
            data-value={mode}
            onClick={() => toggleMenu('mode')}
            onPointerDown={preventSelection}
            type="button"
          >
            <span data-hawk-eye-ui="size-input-token">{SIZE_MODE_LABELS[mode]}</span>
            <span data-hawk-eye-ui="size-input-token-chevron">
              <ChevronIcon />
            </span>
          </button>
        )}
      </div>

      {openMenu === 'mode' ? (
        <div
          data-hawk-eye-ui="size-input-menu"
          data-kind="mode"
          role="menu"
        >
          {SIZE_MODE_OPTIONS.map((option) => (
            <button
              data-hawk-eye-control={`${definition.id}-mode-option-${option.value}`}
              data-hawk-eye-ui="size-input-menu-option"
              data-selected={option.value === mode ? 'true' : 'false'}
              key={option.value}
              onClick={() => handleModeSelect(option.value)}
              onPointerDown={preventSelection}
              role="menuitem"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
