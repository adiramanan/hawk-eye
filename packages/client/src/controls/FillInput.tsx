import { useState } from 'react';
import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { ColorInput } from './ColorInput';
import { GradientEditor } from './GradientEditor';
import { ImageFillEditor } from './ImageFillEditor';
import { detectGradientType } from '../utils/gradient-parser';

type FillMode = 'solid' | 'gradient' | 'image';

interface FillInputProps {
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

function detectFillMode(cssValue: string): FillMode {
  if (!cssValue || cssValue === 'none') return 'solid';

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

/**
 * Convert between fill modes when switching tabs
 */
function convertFillMode(currentValue: string, fromMode: FillMode, toMode: FillMode): string {
  if (toMode === 'solid') {
    // Default to black when switching to solid
    return '#000000';
  }

  if (toMode === 'gradient') {
    // Default gradient
    return 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)';
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
    value: detectFillMode(currentValue) === 'solid' ? (currentValue || '#000000') : '#000000',
    baseline: detectFillMode(snapshot.baseline) === 'solid' ? (snapshot.baseline || '#000000') : '#000000',
    inputValue: detectFillMode(currentValue) === 'solid' ? (currentValue || '#000000') : '#000000',
    invalid: false,
  };

  return (
    <div data-hawk-eye-ui="fill-input">
      {/* Mode Tabs */}
      <div data-hawk-eye-ui="fill-tabs" style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
        {(['solid', 'gradient', 'image'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => switchMode(mode)}
            style={{
              flex: 1,
              padding: 'var(--spacing-sm) var(--spacing-base)',
              fontSize: '12px',
              fontWeight: activeMode === mode ? 'bold' : 'normal',
              cursor: 'pointer',
              backgroundColor: activeMode === mode ? 'var(--color-bg-active)' : 'var(--color-bg-secondary)',
              color: activeMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

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
