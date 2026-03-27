import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { getSizeUnitsForMode, isNumericSizeMode } from '../size-state';
import type { EditablePropertyDefinition, PropertySnapshot, SizeMode } from '../types';
import { extractLooseNumber, parseCssValue } from '../utils/css-value';

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

function getModeIndex(mode: SizeMode) {
  return Math.max(
    0,
    SIZE_MODE_OPTIONS.findIndex((option) => option.value === mode)
  );
}

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

  if (parsed.unit === 'px') {
    return String(Math.round(parsed.number));
  }

  return String(Math.round(parsed.number * 100) / 100);
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldRestoreFocusRef = useRef(false);
  const listboxId = useId();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [activeOptionIndex, setActiveOptionIndex] = useState(() => getModeIndex(mode));
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

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  useEffect(() => {
    setActiveOptionIndex(getModeIndex(mode));
  }, [mode]);

  useEffect(() => {
    if (openMenu !== 'mode') {
      if (shouldRestoreFocusRef.current) {
        shouldRestoreFocusRef.current = false;
        triggerRef.current?.focus();
      }

      return;
    }

    optionRefs.current[activeOptionIndex]?.focus();
  }, [activeOptionIndex, openMenu]);

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
        extractLooseNumber(event.currentTarget.value) ??
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

  function closeMenu(restoreFocus = false) {
    shouldRestoreFocusRef.current = restoreFocus;
    setOpenMenu(null);
  }

  function openMenuAt(index: number) {
    const nextIndex = Math.max(0, Math.min(SIZE_MODE_OPTIONS.length - 1, index));
    setActiveOptionIndex(nextIndex);
    setOpenMenu('mode');
  }

  function toggleMenu(nextMenu: 'mode') {
    if (openMenu === nextMenu) {
      closeMenu(false);
      return;
    }

    openMenuAt(getModeIndex(mode));
  }

  function handleModeSelect(nextMode: SizeMode) {
    setActiveOptionIndex(getModeIndex(nextMode));
    onModeChange(nextMode);
    closeMenu(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = getModeIndex(mode);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        openMenuAt(currentIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        openMenuAt(currentIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        openMenuAt(0);
        break;
      case 'End':
        event.preventDefault();
        openMenuAt(SIZE_MODE_OPTIONS.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        openMenuAt(currentIndex);
        break;
      case 'Escape':
        if (openMenu === 'mode') {
          event.preventDefault();
          closeMenu(true);
        }
        break;
      default:
        break;
    }
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveOptionIndex((current) =>
          Math.min(current + 1, SIZE_MODE_OPTIONS.length - 1)
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveOptionIndex((current) => Math.max(current - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveOptionIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveOptionIndex(SIZE_MODE_OPTIONS.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleModeSelect(SIZE_MODE_OPTIONS[index]?.value ?? mode);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu(false);
        break;
      default:
        break;
    }
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
              aria-controls={listboxId}
              aria-expanded={openMenu === 'mode'}
              aria-haspopup="listbox"
              aria-label={`${definition.label} mode`}
              data-hawk-eye-control={`${definition.id}-mode`}
              data-hawk-eye-ui="size-input-menu-button"
              data-value={mode}
              onClick={() => toggleMenu('mode')}
              onKeyDown={handleTriggerKeyDown}
              onPointerDown={preventSelection}
              ref={triggerRef}
              type="button"
            >
              <ChevronIcon />
            </button>
          </>
        ) : (
          <button
            aria-controls={listboxId}
            aria-expanded={openMenu === 'mode'}
            aria-haspopup="listbox"
            aria-label={`${definition.label} mode`}
            data-hawk-eye-control={`${definition.id}-mode`}
            data-hawk-eye-ui="size-input-token-trigger"
            data-value={mode}
            onClick={() => toggleMenu('mode')}
            onKeyDown={handleTriggerKeyDown}
            onPointerDown={preventSelection}
            ref={triggerRef}
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
          id={listboxId}
          data-hawk-eye-ui="size-input-menu"
          data-kind="mode"
          role="listbox"
        >
          {SIZE_MODE_OPTIONS.map((option, index) => (
            <button
              aria-selected={option.value === mode}
              data-hawk-eye-control={`${definition.id}-mode-option-${option.value}`}
              data-hawk-eye-ui="size-input-menu-option"
              data-selected={option.value === mode ? 'true' : 'false'}
              key={option.value}
              onFocus={() => setActiveOptionIndex(index)}
              onClick={() => handleModeSelect(option.value)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onPointerDown={preventSelection}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              tabIndex={index === activeOptionIndex ? 0 : -1}
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
