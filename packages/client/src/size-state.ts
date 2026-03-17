import { parseCssValue } from './utils/css-value';
import type { PropertySnapshot, SizeAxis, SizeMode, SizeModeMemory } from './types';

export const WIDTH_SIZE_MODE_CSS_PROPERTY = '--hawk-eye-width-mode';
export const HEIGHT_SIZE_MODE_CSS_PROPERTY = '--hawk-eye-height-mode';

const FIXED_SIZE_UNITS: Record<SizeAxis, string[]> = {
  width: ['px'],
  height: ['px'],
};

const RELATIVE_SIZE_UNITS: Record<SizeAxis, string[]> = {
  width: ['%'],
  height: ['%'],
};

const DEFAULT_FIXED_VALUES: Record<SizeAxis, string> = {
  width: '0px',
  height: '0px',
};

const DEFAULT_RELATIVE_VALUES: Record<SizeAxis, string> = {
  width: '100%',
  height: '100%',
};

function isValidSizeMode(value: string): value is SizeMode {
  return value === 'fixed' || value === 'hug' || value === 'fill' || value === 'relative';
}

export function getSizeModeCssProperty(axis: SizeAxis) {
  return axis === 'width' ? WIDTH_SIZE_MODE_CSS_PROPERTY : HEIGHT_SIZE_MODE_CSS_PROPERTY;
}

export function parsePersistedSizeMode(value: string | null | undefined): SizeMode | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return isValidSizeMode(trimmed) ? trimmed : null;
}

export function isNumericSizeMode(mode: SizeMode) {
  return mode === 'fixed' || mode === 'relative';
}

export function getSizeUnitsForMode(axis: SizeAxis, mode: SizeMode, currentValue = '') {
  if (mode === 'relative') {
    return [...RELATIVE_SIZE_UNITS[axis]];
  }

  if (mode === 'fixed') {
    const units = [...FIXED_SIZE_UNITS[axis]];
    if (currentValue.trim() === 'auto' && !units.includes('auto')) {
      units.push('auto');
    }
    return units;
  }

  return [];
}

export function inferSizeMode(
  axis: SizeAxis,
  value: string,
  persistedMode?: string | null
): SizeMode {
  const explicitMode = parsePersistedSizeMode(persistedMode);

  if (explicitMode) {
    return explicitMode;
  }

  const trimmed = value.trim();

  if (trimmed === 'fit-content') {
    return 'hug';
  }

  if (trimmed === '100%') {
    return 'fill';
  }

  const parsed = parseCssValue(trimmed);

  if (parsed && getSizeUnitsForMode(axis, 'relative').includes(parsed.unit)) {
    return 'relative';
  }

  return 'fixed';
}

export function getMeasuredSizeValue(axis: SizeAxis, measuredSize: number) {
  const normalized = Number.isFinite(measuredSize) && measuredSize > 0 ? measuredSize : 0;
  return `${Math.round(normalized)}px`;
}

export function getDefaultSizeValue(axis: SizeAxis, mode: SizeMode, measuredSize: number) {
  if (mode === 'relative') {
    return DEFAULT_RELATIVE_VALUES[axis];
  }

  return getMeasuredSizeValue(axis, measuredSize) || DEFAULT_FIXED_VALUES[axis];
}

export function seedSizeModeMemory(axis: SizeAxis, rawValue: string, measuredSize: number): SizeModeMemory {
  const parsed = parseCssValue(rawValue.trim());
  const relativeUnits = getSizeUnitsForMode(axis, 'relative');
  const fixedUnits = getSizeUnitsForMode(axis, 'fixed');

  return {
    fixed:
      parsed && fixedUnits.includes(parsed.unit || 'px')
        ? rawValue.trim()
        : getDefaultSizeValue(axis, 'fixed', measuredSize),
    relative:
      parsed && relativeUnits.includes(parsed.unit)
        ? rawValue.trim()
        : getDefaultSizeValue(axis, 'relative', measuredSize),
  };
}

export function getNumericMemoryValue(
  axis: SizeAxis,
  mode: Extract<SizeMode, 'fixed' | 'relative'>,
  memory: SizeModeMemory,
  measuredSize: number
) {
  const value = memory[mode].trim();

  if (value) {
    return value;
  }

  return getDefaultSizeValue(axis, mode, measuredSize);
}

export function updateSizeModeMemory(
  axis: SizeAxis,
  mode: Extract<SizeMode, 'fixed' | 'relative'>,
  memory: SizeModeMemory,
  snapshot: PropertySnapshot
) {
  const candidate = (snapshot.inputValue || snapshot.value).trim();
  const parsed = parseCssValue(candidate);
  const allowedUnits = getSizeUnitsForMode(axis, mode);

  if (!parsed || !allowedUnits.includes(parsed.unit || 'px')) {
    return memory;
  }

  return {
    ...memory,
    [mode]: candidate,
  };
}

export function formatSizeValue(value: number, unit: string) {
  const normalized =
    Number.isInteger(value) ? String(Math.trunc(value)) : value.toFixed(3).replace(/\.?0+$/, '');
  return `${normalized}${unit}`;
}
