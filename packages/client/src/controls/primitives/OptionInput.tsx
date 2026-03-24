/**
 * OptionInput Primitive
 *
 * Select from a list of predefined options.
 * Displays as a custom dropdown or segmented control.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface OptionInputProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
  variant?: 'dropdown' | 'segmented';
}

/**
 * OptionInput - Select from predefined options
 */
export const OptionInput = React.forwardRef<HTMLDivElement, OptionInputProps>(
  function OptionInput(
    { value, onChange, options, disabled = false, variant = 'dropdown' },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    const handleSelect = useCallback(
      (val: string) => {
        onChange(val);
        setIsOpen(false);
      },
      [onChange]
    );

    if (variant === 'segmented') {
      return (
        <div
          ref={ref}
          data-hawk-eye-control="option-input-segmented"
          style={{
            display: 'flex',
            gap: 'var(--spacing-2px)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-2px)',
            background: 'var(--he-surface-2)',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: value === option.value ? 'var(--he-input)' : 'transparent',
                color: value === option.value ? 'var(--he-fg)' : 'var(--he-label)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: value === option.value ? 600 : 400,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 150ms var(--he-ease-out)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    // Dropdown variant
    return (
      <div
        ref={ref}
        data-hawk-eye-control="option-input-dropdown"
        style={{ position: 'relative' }}
      >
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--he-input-border)',
            background: 'var(--he-input)',
            color: 'var(--he-fg)',
            fontSize: 'var(--font-size-xs)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{selectedOption?.label || 'Select...'}</span>
          <span
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms var(--he-ease-out)',
              fontSize: '10px',
            }}
          >
            ▼
          </span>
        </button>

        {isOpen && (
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 'var(--spacing-xs)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--he-input-border)',
              background: 'var(--he-surface-2)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm) var(--spacing-base)',
                  border: 'none',
                  background: value === option.value ? 'var(--he-accent-soft)' : 'transparent',
                  color: 'var(--he-fg)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: value === option.value ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 100ms var(--he-ease-out)',
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.background = 'var(--he-surface-3)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.background =
                    value === option.value ? 'var(--he-accent-soft)' : 'transparent';
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

OptionInput.displayName = 'OptionInput';
