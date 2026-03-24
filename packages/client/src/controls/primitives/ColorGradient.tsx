/**
 * ColorGradient Primitive
 *
 * Visual gradient preview and editor for CSS gradients.
 * Displays gradient and allows color/position manipulation.
 */

import React, { useCallback } from 'react';

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface ColorGradientProps {
  value: string; // CSS gradient string
  onChange: (gradient: string) => void;
  disabled?: boolean;
}

/**
 * Parse CSS gradient into stops (simplified for linear gradients)
 */
function parseGradient(gradient: string): GradientStop[] {
  // Extract color stops from gradient string: "linear-gradient(to right, red 0%, blue 100%)"
  const regex = /(\w+|#\w+|rgb[\w\s(),]+)\s+(\d+)%/g;
  const stops: GradientStop[] = [];
  let match;

  while ((match = regex.exec(gradient)) !== null) {
    stops.push({
      color: match[1],
      position: parseInt(match[2]),
    });
  }

  return stops.length > 0 ? stops : [{ color: '#000', position: 0 }];
}

/**
 * Rebuild CSS gradient from stops
 */
function buildGradient(angle: string, stops: GradientStop[]): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopString = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ');
  return `linear-gradient(${angle}, ${stopString})`;
}

/**
 * ColorGradient - Visual gradient editor
 */
export const ColorGradient = React.forwardRef<HTMLDivElement, ColorGradientProps>(
  function ColorGradient({ value, onChange, disabled = false }, ref) {
    const stops = parseGradient(value);

    const handleColorChange = useCallback(
      (index: number, color: string) => {
        const newStops = [...stops];
        newStops[index].color = color;
        onChange(buildGradient('to right', newStops));
      },
      [stops, onChange]
    );

    const handlePositionChange = useCallback(
      (index: number, position: number) => {
        const newStops = [...stops];
        newStops[index].position = Math.max(0, Math.min(100, position));
        onChange(buildGradient('to right', newStops));
      },
      [stops, onChange]
    );

    return (
      <div
        ref={ref}
        data-hawk-eye-control="color-gradient"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Gradient preview */}
        <div
          style={{
            width: '100%',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--he-input-border)',
            background: value,
            cursor: disabled ? 'not-allowed' : 'grab',
          }}
        />

        {/* Color stops */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {stops.map((stop, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 'var(--spacing-xs)',
                alignItems: 'center',
              }}
            >
              {/* Color input */}
              <input
                type="color"
                value={stop.color.startsWith('#') ? stop.color : '#000'}
                onChange={(e) => handleColorChange(idx, e.target.value)}
                disabled={disabled}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--he-input-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              />

              {/* Position slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={stop.position}
                onChange={(e) => handlePositionChange(idx, parseInt(e.target.value))}
                disabled={disabled}
                style={{
                  flex: 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              />

              {/* Position label */}
              <span
                style={{
                  minWidth: '40px',
                  textAlign: 'right',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--he-label)',
                }}
              >
                {stop.position}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ColorGradient.displayName = 'ColorGradient';
