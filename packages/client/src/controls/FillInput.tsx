import { useState } from 'react';
import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { ColorInput } from './ColorInput';
import { GradientEditor } from './GradientEditor';
import { ImageFillEditor } from './ImageFillEditor';
import { detectGradientType } from '../utils/gradient-parser';

type FillMode = 'none' | 'solid' | 'gradient' | 'image';

interface FillInputProps {
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

function detectFillMode(cssValue: string): FillMode {
  if (!cssValue || cssValue === 'none') return 'none';

  const trimmed = cssValue.trim().toLowerCase();

  // Check for gradient
  if (detectGradientType(trimmed)) {
    return 'gradient';
  }

  // Check for image
  if (trimmed.includes('url(')) {
    return 'image';
  }

  // Default to solid
  return 'solid';
}

const DEFAULT_SOLID_COLOR = '#000000';
const DEFAULT_GRADIENT = 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)';

/**
 * Convert between fill modes when switching tabs
 */
function convertFillMode(currentValue: string, fromMode: FillMode, toMode: FillMode): string {
  if (toMode === 'none') {
    return 'none';
  }

  if (toMode === 'solid') {
    // Default to black when switching to solid
    return DEFAULT_SOLID_COLOR;
  }

  if (toMode === 'gradient') {
    // Default gradient
    return DEFAULT_GRADIENT;
  }

  if (toMode === 'image') {
    // Default image fill
    return "url('https://example.com/image.jpg') cover center no-repeat";
  }

  return currentValue;
}

// Create a definition for the color input in solid mode
const SOLID_COLOR_DEFINITION: EditablePropertyDefinition = {
  id: 'backgroundColor',
  label: 'Background',
  shortLabel: 'BG',
  cssProperty: 'background',
  group: 'fill',
  control: 'fill',
  placeholder: 'rgb(255, 255, 255)',
};

const FILL_TAB_LABELS: Record<FillMode, string> = {
  none: 'None',
  solid: 'Solid',
  gradient: 'Gradient',
  image: 'Image',
};

export function FillInput({ snapshot, onChange }: FillInputProps) {
  const currentValue = snapshot.inputValue || snapshot.baseline || '';
  const detectedMode = detectFillMode(currentValue);
  const [activeMode, setActiveMode] = useState<FillMode>(detectedMode);

  function switchMode(newMode: FillMode) {
    if (newMode === activeMode) return;

    const convertedValue = convertFillMode(currentValue, activeMode, newMode);
    onChange(convertedValue);
    setActiveMode(newMode);
  }

  // For solid color mode, we need a simplified snapshot that represents just the color
  const solidColorSnapshot: PropertySnapshot = {
    ...snapshot,
    // If current value looks like a color, use it; otherwise use a default
    value: detectFillMode(currentValue) === 'solid' ? (currentValue || DEFAULT_SOLID_COLOR) : DEFAULT_SOLID_COLOR,
    baseline: detectFillMode(snapshot.baseline) === 'solid' ? (snapshot.baseline || DEFAULT_SOLID_COLOR) : DEFAULT_SOLID_COLOR,
    inputValue: detectFillMode(currentValue) === 'solid' ? (currentValue || DEFAULT_SOLID_COLOR) : DEFAULT_SOLID_COLOR,
    invalid: false,
  };

  return (
    <div data-hawk-eye-ui="fill-input">
      {/* Mode Tabs */}
      <div data-hawk-eye-ui="fill-tabs" style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
        {(['none', 'solid', 'gradient', 'image'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => switchMode(mode)}
            style={{
              flex: 1,
              padding: 'var(--spacing-sm) var(--spacing-base)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: activeMode === mode ? 'var(--font-weight-bold)' : 'var(--font-weight-base)',
              cursor: 'pointer',
              backgroundColor: activeMode === mode ? 'var(--color-selection-bg)' : 'var(--color-bg-secondary)',
              color: activeMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--duration-base) var(--easing-standard)',
            }}
          >
            {FILL_TAB_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* None Mode */}
      {activeMode === 'none' && (
        <div data-hawk-eye-ui="fill-none" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: 'var(--spacing-sm) 0' }}>
          No background fill
        </div>
      )}

      {/* Solid Color Mode */}
      {activeMode === 'solid' && (
        <div data-hawk-eye-ui="fill-solid">
          <ColorInput
            definition={SOLID_COLOR_DEFINITION}
            onChange={onChange}
            snapshot={solidColorSnapshot}
          />
        </div>
      )}

      {/* Gradient Mode */}
      {activeMode === 'gradient' && (
        <div data-hawk-eye-ui="fill-gradient">
          <GradientEditor
            snapshot={{ ...snapshot, inputValue: currentValue, baseline: currentValue }}
            onChange={onChange}
          />
        </div>
      )}

      {/* Image Mode */}
      {activeMode === 'image' && (
        <div data-hawk-eye-ui="fill-image">
          <ImageFillEditor
            snapshot={{ ...snapshot, inputValue: currentValue, baseline: currentValue }}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}
