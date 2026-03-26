/**
 * InputBox Component
 *
 * A flexible input box component that supports optional prefix, suffix, and modifier slots
 * matching the Figma Input Box design with 16 variants:
 * - Label: True/False
 * - Prefix: True/False
 * - Suffix: True/False
 * - Modifier: True/False
 */

import React from 'react';

interface InputBoxProps {
  label?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  modifier?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/**
 * InputBox - A compound input control wrapper supporting all variant combinations
 *
 * Usage:
 * ```tsx
 * <InputBox
 *   label="Padding"
 *   prefix={<span>W</span>}
 *   suffix={<UnitSelector />}
 *   modifier={<LinkButton />}
 * >
 *   <input type="text" />
 * </InputBox>
 * ```
 */
export const InputBox = React.forwardRef<HTMLDivElement, InputBoxProps>(
  function InputBox(
    { label, prefix, suffix, modifier, children, disabled, invalid, className },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={className}
        data-hawk-eye-ui="input-box"
        data-has-label={label ? 'true' : 'false'}
        data-has-prefix={prefix ? 'true' : 'false'}
        data-has-suffix={suffix ? 'true' : 'false'}
        data-has-modifier={modifier ? 'true' : 'false'}
        data-disabled={disabled ? 'true' : 'false'}
        data-invalid={invalid ? 'true' : 'false'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: label ? 'var(--spacing-xs)' : undefined,
        }}
      >
        {label && (
          <label
            data-hawk-eye-ui="input-box-label"
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-base)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {label}
          </label>
        )}

        <div
          data-hawk-eye-ui="input-box-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: prefix || suffix || modifier ? 'var(--spacing-xs)' : undefined,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: disabled ? 'var(--color-bg-tertiary)' : undefined,
            border: invalid
              ? `1px solid var(--color-error)`
              : `1px solid var(--color-input-border)`,
            padding: 'var(--spacing-xs)',
          }}
        >
          {prefix && (
            <div
              data-hawk-eye-ui="input-box-prefix"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {prefix}
            </div>
          )}

          <div
            data-hawk-eye-ui="input-box-input-wrapper"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {children}
          </div>

          {suffix && (
            <div
              data-hawk-eye-ui="input-box-suffix"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {suffix}
            </div>
          )}

          {modifier && (
            <div
              data-hawk-eye-ui="input-box-modifier"
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {modifier}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InputBox.displayName = 'InputBox';
