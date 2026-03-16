import { useRef, useState } from 'react';
import type { EditablePropertyDefinition, PropertySnapshot } from '../types';
import { ColorPicker } from './ColorPicker';

interface ColorInputProps {
  definition: EditablePropertyDefinition;
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

export function ColorInput({ definition, snapshot, onChange }: ColorInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorRectRef = useRef<DOMRect | null>(null);
  const swatchRef = useRef<HTMLSpanElement>(null);

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
            style={{ backgroundColor: snapshot.inputValue || snapshot.baseline || 'transparent' }}
          />
        </button>
        <input
          aria-label={definition.label}
          data-hawk-eye-control={definition.id}
          data-hawk-eye-ui="text-input"
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={definition.placeholder}
          type="text"
          value={snapshot.inputValue || snapshot.baseline}
        />
      </div>
      {pickerOpen && anchorRectRef.current && (
        <ColorPicker
          anchorRect={anchorRectRef.current}
          onChange={onChange}
          onClose={() => setPickerOpen(false)}
          value={snapshot.inputValue || snapshot.baseline}
        />
      )}
    </>
  );
}
