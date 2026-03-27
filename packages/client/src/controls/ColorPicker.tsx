import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import {
  type HsvColor,
  parseColor,
  rgbaToHsv,
  hsvToRgba,
  rgbaToHex,
} from '../utils/color';

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

function hsvToHex(hsv: HsvColor): string {
  return rgbaToHex(hsvToRgba(hsv));
}

function toOpaqueHex(hsv: HsvColor): string {
  return rgbaToHex({ ...hsvToRgba(hsv), a: 1 }).slice(1, 7).toUpperCase();
}

export function ColorPicker({ id, label, value, onChange, onClose, anchorRect, triggerRef }: ColorPickerProps) {
  const initialHsv = useMemo<HsvColor>(() => {
    const rgba = parseColor(value);
    return rgba ? rgbaToHsv(rgba) : { h: 0, s: 1, v: 1, a: 1 };
  }, []); // intentionally only on mount

  const [hsv, setHsv] = useState<HsvColor>(initialHsv);
  const [hexInput, setHexInput] = useState(() => toOpaqueHex(initialHsv));
  const [alphaInput, setAlphaInput] = useState(() => String(Math.round(initialHsv.a * 100)));
  const popoverRef = useRef<HTMLDivElement>(null);
  const isDraggingGradient = useRef(false);

  // Keep text inputs in sync when hsv changes via drag/slider
  useEffect(() => {
    setHexInput(toOpaqueHex(hsv));
    setAlphaInput(String(Math.round(hsv.a * 100)));
  }, [hsv]);

  useEffect(() => {
    // The picker is portaled into the shadow root. From `document`, composedPath()
    // cannot see shadow-DOM internals, so clicks inside the picker would always
    // appear "outside" and close it immediately. Listen on the shadow root instead.
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
    onChange(hsvToHex(next));
  }

  function commitHex(hex: string) {
    const rgba = parseColor(`#${hex}`);
    if (rgba) {
      const nextHsv = rgbaToHsv(rgba);
      commitHsv({ ...nextHsv, a: hsv.a });
    }
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

  // Derive display values
  const pureHue = `hsl(${hsv.h}, 100%, 50%)`;
  const opaqueColor = `#${toOpaqueHex(hsv)}`;
  const currentColor = hsvToHex(hsv);

  // Position popover near the anchor
  const POPOVER_WIDTH = 232;
  const POPOVER_HEIGHT = 280;
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
      {/* Saturation–Value gradient square */}
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

      {/* Swatch + hue/alpha sliders */}
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

      {/* Hex + alpha text inputs */}
      <div data-hawk-eye-ui="color-fallback-fields">
        <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 3 }}>
          <span data-hawk-eye-ui="color-field-label">#</span>
          <input
            aria-label="Hex color"
            data-hawk-eye-ui="text-input"
            maxLength={6}
            onBlur={(e) => commitHex(e.currentTarget.value)}
            onChange={(e) => setHexInput(e.currentTarget.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => { if (e.key === 'Enter') commitHex(hexInput); }}
            type="text"
            value={hexInput}
          />
          <span data-hawk-eye-ui="color-field-unit">Hex</span>
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
