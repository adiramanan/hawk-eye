/**
 * UnitSelector Primitive
 *
 * Select/change units for numeric values (px, em, %, rem, etc.)
 * Standalone unit switcher component.
 */

import React, { useState, useCallback } from 'react';

export interface UnitSelectorProps {
  value: string;
  onChange: (unit: string) => void;
  units?: string[];
  disabled?: boolean;
}

const DEFAULT_UNITS = ['px', 'em', 'rem', '%', 'vw', 'vh'];

/**
 * UnitSelector - Select units for numeric values
 * Displays current unit with dropdown to switch
 */
export const UnitSelector = React.forwardRef<HTMLSelectElement, UnitSelectorProps>(
  function UnitSelector({ value, onChange, units = DEFAULT_UNITS, disabled = false }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
        setIsOpen(false);
      },
      [onChange]
    );

    return (
      <select
        ref={ref}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        data-hawk-eye-control="unit-selector"
        style={{
          appearance: 'none',
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--he-input-border)',
          background: 'var(--he-input)',
          color: 'var(--he-fg)',
          fontFamily: 'var(--he-font-ui)',
          fontSize: 'var(--font-size-xs)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minWidth: '60px',
        }}
      >
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    );
  }
);

UnitSelector.displayName = 'UnitSelector';
