import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type RgbaColor,
  parseColor,
  rgbaToHex,
  rgbaToString,
} from '../utils/color';

interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  onClose(): void;
  anchorRect: DOMRect;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toOpaqueHex(color: RgbaColor) {
  return rgbaToHex({ ...color, a: 1 }).slice(0, 7);
}

function normalizeHexInput(value: string) {
  return value.trim().replace(/^#/, '');
}

function formatColorWithAlpha(baseHex: string, alphaPercent: number) {
  const parsed = parseColor(baseHex);

  if (!parsed) {
    return null;
  }

  const alpha = clamp(alphaPercent, 0, 100) / 100;

  if (alpha >= 1) {
    return toOpaqueHex(parsed);
  }

  return rgbaToString({
    ...parsed,
    a: Number(alpha.toFixed(2)),
  });
}

export function ColorPicker({ id, label, value, onChange, onClose, anchorRect }: ColorPickerProps) {
  const initialColor = useMemo(
    () => parseColor(value) ?? { r: 0, g: 0, b: 0, a: 1 },
    [value]
  );
  const [hexInput, setHexInput] = useState(() => toOpaqueHex(initialColor));
  const [alphaInput, setAlphaInput] = useState(() => String(Math.round(initialColor.a * 100)));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseColor(value);

    if (!parsed) {
      return;
    }

    setHexInput(toOpaqueHex(parsed));
    setAlphaInput(String(Math.round(parsed.a * 100)));
  }, [value]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const path = event.composedPath();

      if (popoverRef.current && !path.includes(popoverRef.current)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  function commit(nextHex: string, nextAlphaInput: string) {
    const cleanedHex = normalizeHexInput(nextHex);
    const alphaPercent = clamp(Number.parseFloat(nextAlphaInput) || 0, 0, 100);
    const formatted = formatColorWithAlpha(`#${cleanedHex}`, alphaPercent);

    if (!formatted) {
      return;
    }

    setHexInput(toOpaqueHex(parseColor(formatted) ?? initialColor));
    setAlphaInput(String(Math.round(alphaPercent)));
    onChange(formatted);
  }

  const previewColor = formatColorWithAlpha(hexInput, clamp(Number.parseFloat(alphaInput) || 0, 0, 100))
    ?? rgbaToString(initialColor);

  const POPOVER_WIDTH = 232;
  const GAP = 8;
  let top = anchorRect.bottom + GAP;
  let left = anchorRect.left;

  if (top + 188 > window.innerHeight - 8) {
    top = anchorRect.top - 188 - GAP;
  }

  if (left + POPOVER_WIDTH > window.innerWidth - 8) {
    left = window.innerWidth - POPOVER_WIDTH - 8;
  }

  left = Math.max(8, left);
  top = Math.max(8, top);

  return (
    <div
      aria-label={`${label} color picker`}
      aria-modal="false"
      data-hawk-eye-ui="color-popover"
      id={id}
      ref={popoverRef}
      role="dialog"
      style={{ left, position: 'fixed', top }}
    >
      <div data-hawk-eye-ui="color-popover-header">
        <div
          data-hawk-eye-ui="color-swatch-preview"
          style={{ backgroundColor: previewColor }}
        />
        <div data-hawk-eye-ui="color-popover-copy">
          <p data-hawk-eye-ui="color-popover-title">{label}</p>
          <p data-hawk-eye-ui="color-popover-subtitle">Fallback color control</p>
        </div>
      </div>

      <label data-hawk-eye-ui="color-native-field">
        <span data-hawk-eye-ui="color-native-label">Color</span>
        <input
          aria-label={`${label} native color`}
          data-hawk-eye-ui="color-native-input"
          onChange={(event) => {
            const nextHex = event.currentTarget.value;
            setHexInput(nextHex);
            commit(nextHex, alphaInput);
          }}
          type="color"
          value={toOpaqueHex(parseColor(previewColor) ?? initialColor)}
        />
      </label>

      <div data-hawk-eye-ui="color-fallback-fields">
        <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 3 }}>
          <span data-hawk-eye-ui="color-field-label">#</span>
          <input
            aria-label="Hex color"
            data-hawk-eye-ui="text-input"
            maxLength={6}
            onBlur={(event) => commit(event.currentTarget.value, alphaInput)}
            onChange={(event) => setHexInput(event.currentTarget.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commit(hexInput, alphaInput);
              }
            }}
            type="text"
            value={normalizeHexInput(hexInput)}
          />
          <span data-hawk-eye-ui="color-field-unit">Hex</span>
        </div>
        <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 1 }}>
          <input
            aria-label="Alpha %"
            data-hawk-eye-ui="text-input"
            onBlur={(event) => commit(hexInput, event.currentTarget.value)}
            onChange={(event) => setAlphaInput(event.currentTarget.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commit(hexInput, alphaInput);
              }
            }}
            type="text"
            value={alphaInput}
          />
          <span data-hawk-eye-ui="color-field-unit">%</span>
        </div>
      </div>
    </div>
  );
}
