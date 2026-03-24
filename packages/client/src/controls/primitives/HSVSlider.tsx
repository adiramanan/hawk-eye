/**
 * HSVSlider Primitive
 *
 * Individual sliders for Hue, Saturation, Value (HSV/HSB color space).
 * Can be combined to create a full HSV color picker.
 */

import React, { useCallback } from 'react';

export type HSVComponent = 'hue' | 'saturation' | 'value';

export interface HSVSliderProps {
  component: HSVComponent;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  baseColor?: string; // For preview gradient
}

/**
 * Get gradient for HSV slider preview
 */
function getSliderGradient(component: HSVComponent, baseColor: string): string {
  switch (component) {
    case 'hue':
      return 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)';
    case 'saturation':
      return `linear-gradient(to right, ${baseColor}, ${baseColor}cc)`;
    case 'value':
      return `linear-gradient(to right, black, ${baseColor})`;
  }
}

/**
 * Get label and range for each component
 */
function getComponentInfo(component: HSVComponent): {
  label: string;
  min: number;
  max: number;
  format: (v: number) => string;
} {
  switch (component) {
    case 'hue':
      return { label: 'H', min: 0, max: 360, format: (v) => `${Math.round(v)}°` };
    case 'saturation':
      return { label: 'S', min: 0, max: 100, format: (v) => `${Math.round(v)}%` };
    case 'value':
      return { label: 'V', min: 0, max: 100, format: (v) => `${Math.round(v)}%` };
  }
}

/**
 * HSVSlider - Individual HSV component slider
 */
export const HSVSlider = React.forwardRef<HTMLDivElement, HSVSliderProps>(
  function HSVSlider({ component, value, onChange, disabled = false, baseColor = '#ff0000' }, ref) {
    const info = getComponentInfo(component);
    const gradient = getSliderGradient(component, baseColor);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseFloat(e.target.value));
      },
      [onChange]
    );

    return (
      <div
        ref={ref}
        data-hawk-eye-control={`hsv-slider-${component}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Label and value */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--he-label)' }}>
            {info.label}
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--he-fg)',
              fontWeight: 600,
              minWidth: '45px',
              textAlign: 'right',
            }}
          >
            {info.format(value)}
          </span>
        </div>

        {/* Slider with gradient preview */}
        <div
          style={{
            position: 'relative',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--he-input-border)',
            overflow: 'hidden',
          }}
        >
          {/* Gradient background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: gradient,
              pointerEvents: 'none',
            }}
          />

          {/* Slider input */}
          <input
            type="range"
            min={info.min}
            max={info.max}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0,
              opacity: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              zIndex: 10,
            }}
          />

          {/* Visual thumb position indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${((value - info.min) / (info.max - info.min)) * 100}%`,
              top: 0,
              height: '100%',
              width: '2px',
              background: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.2)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    );
  }
);

HSVSlider.displayName = 'HSVSlider';
