/**
 * FontPicker Component
 *
 * A dedicated component for selecting fonts, matching the Figma design.
 * Provides a dropdown interface for font selection with support for:
 * - System fonts
 * - Web fonts
 * - Font stacks
 */

import React, { useState, useRef, useEffect } from 'react';
interface FontPickerProps {
  value: string;
  onChange(value: string): void;
  onClose?(): void;
}

// Common font options
const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'IBM Plex Sans', value: '"IBM Plex Sans", sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", sans-serif' },
];

export function FontPicker({ value, onChange, onClose }: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get display label from value
  const displayLabel = FONT_OPTIONS.find((opt) => opt.value === value)?.label || value;

  // Filter options based on search
  const filteredOptions = FONT_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  function handleSelect(fontValue: string) {
    onChange(fontValue);
    setIsOpen(false);
    onClose?.();
  }

  return (
    <div data-hawk-eye-ui="font-picker">
      <button
        ref={triggerRef}
        aria-label="Select font"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 'var(--spacing-xs) var(--spacing-md)',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid var(--color-input-border)`,
          backgroundColor: 'var(--color-input-bg)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer',
          transition: `all var(--duration-base) var(--easing-standard)`,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-input-hover)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-input-bg)';
        }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>▼</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          data-hawk-eye-ui="font-picker-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 'var(--spacing-xs)',
            backgroundColor: 'var(--color-bg-secondary)',
            border: `1px solid var(--color-border)`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {/* Search input */}
          <div style={{ padding: 'var(--spacing-md)', borderBottom: `1px solid var(--color-border)` }}>
            <input
              autoFocus
              placeholder="Search fonts..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid var(--color-input-border)`,
                backgroundColor: 'var(--color-input-bg)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            />
          </div>

          {/* Options */}
          <div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  data-hawk-eye-ui="font-picker-option"
                  onClick={() => handleSelect(option.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: value === option.value ? 'var(--color-selection-bg)' : 'transparent',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    transition: `background-color var(--duration-base) var(--easing-standard)`,
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option.value) {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option.value) {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontFamily: option.value }}>{option.label}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {option.value}
                  </div>
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: 'var(--spacing-lg)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No fonts found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
