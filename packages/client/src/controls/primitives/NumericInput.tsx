/**
 * NumericInput Primitive
 *
 * Pure numeric input with parsing, formatting, and validation.
 * No scrubbing, no units - just numeric value handling.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { parseExpression } from '../../utils/parse-expression';

export interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  allowKeywords?: string[];
  onInvalid?: (error: string) => void;
}

/**
 * Pure numeric input component
 * Handles: parsing, formatting, validation, keyboard navigation
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      value,
      onChange,
      step = 1,
      min,
      max,
      disabled = false,
      allowKeywords = [],
      onInvalid,
    },
    ref
  ) {
    const [inputValue, setInputValue] = useState(value);
    const [isInvalid, setIsInvalid] = useState(false);

    // Sync external value changes
    useEffect(() => {
      setInputValue(value);
      setIsInvalid(false);
    }, [value]);

    // Parse and validate input
    const parseValue = useCallback(
      (text: string): { valid: boolean; value?: string; error?: string } => {
        const trimmed = text.trim();

        // Check keywords first
        if (allowKeywords.includes(trimmed.toLowerCase())) {
          return { valid: true, value: trimmed };
        }

        // Try to parse as expression
        try {
          const result = parseExpression(trimmed);
          const numValue = parseFloat(result);

          if (isNaN(numValue)) {
            return { valid: false, error: 'Invalid number' };
          }

          if (min !== undefined && numValue < min) {
            return { valid: false, error: `Minimum value is ${min}` };
          }

          if (max !== undefined && numValue > max) {
            return { valid: false, error: `Maximum value is ${max}` };
          }

          return { valid: true, value: String(numValue) };
        } catch (e) {
          return { valid: false, error: 'Invalid expression' };
        }
      },
      [allowKeywords, min, max]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value;
        setInputValue(newValue);
      },
      []
    );

    const handleBlur = useCallback(() => {
      const result = parseValue(inputValue);

      if (result.valid && result.value) {
        setIsInvalid(false);
        onChange(result.value);
      } else {
        setIsInvalid(true);
        if (onInvalid && result.error) {
          onInvalid(result.error);
        }
      }
    }, [inputValue, parseValue, onChange, onInvalid]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleBlur();
        } else if (e.key === 'Escape') {
          setInputValue(value);
          setIsInvalid(false);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentNum = parseFloat(inputValue) || 0;
          const multiplier = e.shiftKey ? 10 : 1;
          const newValue = String(currentNum + step * multiplier);
          setInputValue(newValue);
          onChange(newValue);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentNum = parseFloat(inputValue) || 0;
          const multiplier = e.shiftKey ? 10 : 1;
          const newValue = String(currentNum - step * multiplier);
          setInputValue(newValue);
          onChange(newValue);
        }
      },
      [value, inputValue, step, onChange, handleBlur]
    );

    return (
      <input
        ref={ref}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        data-hawk-eye-control="numeric-input"
        style={{
          borderColor: isInvalid ? 'var(--color-error)' : undefined,
          opacity: disabled ? 0.6 : 1,
        }}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';
