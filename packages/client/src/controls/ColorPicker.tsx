import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import {
  type HsvColor,
  parseColor,
  rgbaToHex,
  rgbaToHsla,
  rgbaToHsv,
  rgbaToOklchString,
  rgbaToRgbString,
  hsvToRgba,
} from '../utils/color';

type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  onClose(): void;
  anchorRect: DOMRect;
  triggerRef?: RefObject<HTMLElement | null>;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function hsvToHex(hsv: HsvColor) {
  return rgbaToHex(hsvToRgba(hsv));
}

function toOpaqueHex(hsv: HsvColor) {
  return rgbaToHex({ ...hsvToRgba(hsv), a: 1 }).slice(1, 7).toUpperCase();
}

function formatColorValue(format: ColorFormat, hsv: HsvColor) {
  const rgba = hsvToRgba(hsv);
  switch (format) {
    case 'rgb':
      return rgbaToRgbString(rgba);
    case 'hsl': {
      const hsla = rgbaToHsla(rgba);
      if (hsla.a < 1) {
        return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${Number(hsla.a.toFixed(2))})`;
      }
      return `hsl(${hsla.h}, ${hsla.s}%, ${hsla.l}%)`;
    }
    case 'oklch':
      return rgbaToOklchString(rgba);
    case 'hex':
    default:
      return rgbaToHex(rgba).toUpperCase();
  }
}

export function ColorPicker({ id, label, value, onChange, onClose, anchorRect, triggerRef }: ColorPickerProps) {
  const initialRgba = useMemo(() => parseColor(value), [value]);
  const initialHsv = useMemo<HsvColor>(() => {
    return initialRgba ? rgbaToHsv(initialRgba) : { h: 0, s: 1, v: 1, a: 1 };
  }, [initialRgba]);

  const [hsv, setHsv] = useState<HsvColor>(initialHsv);
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [rawValue, setRawValue] = useState(() => formatColorValue('hex', initialHsv));
  const [alphaInput, setAlphaInput] = useState(() => String(Math.round(initialHsv.a * 100)));
  const popoverRef = useRef<HTMLDivElement>(null);
  const isDraggingGradient = useRef(false);

  useEffect(() => {
    setRawValue(formatColorValue(format, hsv));
    setAlphaInput(String(Math.round(hsv.a * 100)));
  }, [format, hsv]);

  useEffect(() => {
    const root = popoverRef.current?.getRootNode();
    const pointerTarget = (root instanceof ShadowRoot ? root : document) as EventTarget;

    function handlePointerDown(event: Event) {
      const path = event.composedPath();
      const inPicker = popoverRef.current && path.includes(popoverRef.current);
      const inTrigger = triggerRef?.current && path.includes(triggerRef.current);
      if (!inPicker && !inTrigger) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    pointerTarget.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      pointerTarget.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose, triggerRef]);

  function commitHsv(next: HsvColor) {
    setHsv(next);
    onChange(formatColorValue(format, next));
  }

  function commitRawValue(nextValue: string) {
    setRawValue(nextValue);
    const parsed = parseColor(nextValue);
    if (!parsed) {
      return;
    }

    const nextHsv = rgbaToHsv(parsed);
    nextHsv.a = parsed.a;
    setHsv(nextHsv);
    onChange(formatColorValue(format, nextHsv));
  }

  function commitAlpha(alphaStr: string) {
    const a = clamp((parseFloat(alphaStr) || 0) / 100, 0, 1);
    commitHsv({ ...hsv, a });
  }

  function handleGradientPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const s = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    commitHsv({ ...hsv, s, v });
  }

  const pureHue = `hsl(${hsv.h}, 100%, 50%)`;
  const opaqueColor = `#${toOpaqueHex(hsv)}`;
  const currentColor = hsvToHex(hsv);

  const POPOVER_WIDTH = 256;
  const POPOVER_HEIGHT = 332;
  const GAP = 8;
  let top = anchorRect.bottom + GAP;
  let left = anchorRect.left;

  if (top + POPOVER_HEIGHT > window.innerHeight - 8) {
    top = anchorRect.top - POPOVER_HEIGHT - GAP;
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
      <div data-hawk-eye-ui="color-field-wrap" style={{ marginBottom: 8 }}>
        <select
          aria-label="Color format"
          data-hawk-eye-control="color-format"
          data-hawk-eye-ui="select-input"
          onChange={(event) => setFormat(event.currentTarget.value as ColorFormat)}
          value={format}
        >
          <option value="hex">Hex</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
          <option value="oklch">OKLCH</option>
        </select>
      </div>

      <div
        data-hawk-eye-ui="color-canvas-wrap"
        style={{ backgroundColor: pureHue }}
        onPointerDown={(e) => {
          isDraggingGradient.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          handleGradientPointer(e);
        }}
        onPointerMove={(e) => {
          if (isDraggingGradient.current) handleGradientPointer(e);
        }}
        onPointerUp={() => { isDraggingGradient.current = false; }}
        onPointerCancel={() => { isDraggingGradient.current = false; }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, white, transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, black)' }} />
        <div
          data-hawk-eye-ui="color-canvas-thumb"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>

      <div data-hawk-eye-ui="color-sliders">
        <div
          data-hawk-eye-ui="color-swatch-preview"
          style={{ backgroundColor: currentColor }}
        />
        <div data-hawk-eye-ui="color-slider-stack">
          <input
            aria-label="Hue"
            data-hawk-eye-ui="hue-slider"
            max={360}
            min={0}
            onChange={(e) => commitHsv({ ...hsv, h: Number(e.currentTarget.value) })}
            type="range"
            value={hsv.h}
          />
          <input
            aria-label="Alpha"
            data-hawk-eye-ui="alpha-slider"
            max={1}
            min={0}
            onChange={(e) => commitHsv({ ...hsv, a: Number(e.currentTarget.value) })}
            step={0.01}
            style={{ '--alpha-gradient': `linear-gradient(to right, transparent, ${opaqueColor})` } as CSSProperties}
            type="range"
            value={hsv.a}
          />
        </div>
      </div>

      <div data-hawk-eye-ui="color-fallback-fields">
        <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 3 }}>
          <input
            aria-label="Color value"
            data-hawk-eye-ui="text-input"
            onBlur={(e) => commitRawValue(e.currentTarget.value)}
            onChange={(e) => setRawValue(e.currentTarget.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitRawValue(e.currentTarget.value);
              }
            }}
            type="text"
            value={rawValue}
          />
          <span data-hawk-eye-ui="color-field-unit">{format.toUpperCase()}</span>
        </div>
        <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 1 }}>
          <input
            aria-label="Alpha %"
            data-hawk-eye-ui="text-input"
            onBlur={(e) => commitAlpha(e.currentTarget.value)}
            onChange={(e) => setAlphaInput(e.currentTarget.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => { if (e.key === 'Enter') commitAlpha(alphaInput); }}
            type="text"
            value={alphaInput}
          />
          <span data-hawk-eye-ui="color-field-unit">%</span>
        </div>
      </div>
    </div>
  );
}
