import { useRef, useState } from 'react';
import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { parseColor, rgbaToHex } from '../utils/color';
import { ColorPicker } from './ColorPicker';

interface ColorInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

function normalizeColorDisplay(value: string): string {
  // Always display colors in hex format for consistency
  const parsed = parseColor(value);
  if (parsed) {
    // Return hex format with alpha channel if needed
    const hex = rgbaToHex(parsed);
    if (parsed.a < 1) {
      return hex; // rgbaToHex includes alpha in hex format
    }
    return hex;
  }
  return value; // fallback to original if parsing fails
}

export function ColorInput({ definition, snapshot, onChange }: ColorInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorRectRef = useRef<DOMRect | null>(null);
  const swatchRef = useRef<HTMLSpanElement>(null);

  const displayValue = snapshot.inputValue || snapshot.baseline;
  const normalizedDisplay = normalizeColorDisplay(displayValue);

  function handleSwatchClick() {
    if (swatchRef.current) {
      anchorRectRef.current = swatchRef.current.getBoundingClientRect();
    }
    setPickerOpen((prev) => !prev);
  }

  return (
    <>
      <div data-hawk-eye-ui="color-row">
        <button
          aria-label={`Open color picker for ${definition.label}`}
          data-hawk-eye-ui="color-swatch-btn"
          onClick={handleSwatchClick}
          type="button"
        >
          <span
            data-hawk-eye-ui="color-swatch"
            ref={swatchRef}
            style={{ backgroundColor: displayValue || 'transparent' }}
          />
        </button>
        <input
          aria-label={definition.label}
          data-hawk-eye-control={definition.id}
          data-hawk-eye-ui="text-input"
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={definition.placeholder}
          type="text"
          value={normalizedDisplay}
        />
      </div>
      {pickerOpen && anchorRectRef.current && (
        <ColorPicker
          anchorRect={anchorRectRef.current}
          onChange={onChange}
          onClose={() => setPickerOpen(false)}
          value={displayValue}
        />
      )}
    </>
  );
}
