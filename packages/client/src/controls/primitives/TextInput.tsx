/**
 * TextInput Primitive
 *
 * Base text input wrapper with consistent styling and behavior.
 * Foundation for more complex text-based inputs.
 */

import React, { useCallback } from 'react';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  type?: 'text' | 'email' | 'url' | 'password';
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * TextInput - Base text input with consistent styling
 */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      value,
      onChange,
      placeholder,
      disabled = false,
      readOnly = false,
      maxLength,
      type = 'text',
      onFocus,
      onBlur,
    },
    ref
  ) {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        data-hawk-eye-control="text-input"
        style={{
          width: '100%',
          padding: 'var(--spacing-xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--he-input-border)',
          background: disabled ? 'var(--he-surface-2)' : 'var(--he-input)',
          color: 'var(--he-fg)',
          fontFamily: 'var(--he-font-ui)',
          fontSize: 'var(--font-size-xs)',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 150ms var(--he-ease-out)',
        }}
        onFocus={(e) => {
          (e.target as HTMLInputElement).style.borderColor = 'var(--he-ring)';
          onFocus?.();
        }}
        onBlur={(e) => {
          (e.target as HTMLInputElement).style.borderColor = 'var(--he-input-border)';
          onBlur?.();
        }}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
