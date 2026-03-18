import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type HsvColor,
  type RgbaColor,
  hsvToRgba,
  parseColor,
  rgbaToHex,
  rgbaToHsla,
  rgbaToHsv,
  rgbaToString,
} from '../utils/color';

type ColorMode = 'hex' | 'rgb' | 'hsl';

interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange(value: string): void;
  onClose(): void;
  anchorRect: DOMRect;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hsvToOutputString(hsv: HsvColor): string {
  const rgba = hsvToRgba(hsv);
  if (hsv.a < 1) return rgbaToString(rgba);
  return rgbaToHex(rgba);
}

function drawCanvas(canvas: HTMLCanvasElement, hue: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;

  // White to pure hue gradient (horizontal)
  const hueRgba = hsvToRgba({ h: hue, s: 1, v: 1, a: 1 });
  const hueStr = `rgb(${hueRgba.r},${hueRgba.g},${hueRgba.b})`;
  const gradH = ctx.createLinearGradient(0, 0, width, 0);
  gradH.addColorStop(0, 'white');
  gradH.addColorStop(1, hueStr);
  ctx.fillStyle = gradH;
  ctx.fillRect(0, 0, width, height);

  // Transparent to black gradient (vertical)
  const gradV = ctx.createLinearGradient(0, 0, 0, height);
  gradV.addColorStop(0, 'rgba(0,0,0,0)');
  gradV.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = gradV;
  ctx.fillRect(0, 0, width, height);
}

export function ColorPicker({ id, label, value, onChange, onClose, anchorRect }: ColorPickerProps) {
  const initialRgba = parseColor(value) ?? { r: 0, g: 0, b: 0, a: 1 };
  const initialHsv = rgbaToHsv(initialRgba);

  const [hsv, setHsv] = useState<HsvColor>(initialHsv);
  const [mode, setMode] = useState<ColorMode>('hex');
  const [hexInput, setHexInput] = useState(() => rgbaToHex(hsvToRgba(initialHsv)).replace('#', ''));
  const [rgbInputs, setRgbInputs] = useState<[string, string, string]>(() => {
    const c = hsvToRgba(initialHsv);
    return [String(c.r), String(c.g), String(c.b)];
  });
  const [hslInputs, setHslInputs] = useState<[string, string, string]>(() => {
    const h = rgbaToHsla(hsvToRgba(initialHsv));
    return [String(h.h), String(h.s), String(h.l)];
  });
  const [alphaInput, setAlphaInput] = useState(() => String(Math.round(initialHsv.a * 100)));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvas = useRef(false);

  // Sync fields from HSV whenever HSV changes programmatically
  const syncFieldsFromHsv = useCallback((newHsv: HsvColor) => {
    const rgba = hsvToRgba(newHsv);
    setHexInput(rgbaToHex({ ...rgba, a: 1 }).replace('#', ''));
    setRgbInputs([String(rgba.r), String(rgba.g), String(rgba.b)]);
    const hsla = rgbaToHsla(rgba);
    setHslInputs([String(hsla.h), String(hsla.s), String(hsla.l)]);
    setAlphaInput(String(Math.round(newHsv.a * 100)));
  }, []);

  // Redraw canvas on mount and whenever hue changes
  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current, hsv.h);
  }, [hsv.h]);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const path = e.composedPath();
      if (popoverRef.current && !path.includes(popoverRef.current)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  function emitChange(newHsv: HsvColor) {
    onChange(hsvToOutputString(newHsv));
  }

  function updateHsv(newHsv: HsvColor) {
    setHsv(newHsv);
    syncFieldsFromHsv(newHsv);
    emitChange(newHsv);
  }

  // Canvas pointer interactions
  function handleCanvasPointer(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const s = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
    const newHsv = { ...hsv, s, v };
    updateHsv(newHsv);
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    isDraggingCanvas.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleCanvasPointer(e);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDraggingCanvas.current) return;
    handleCanvasPointer(e);
  }

  function handleCanvasPointerUp() {
    isDraggingCanvas.current = false;
  }

  function handleCanvasKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const step = event.shiftKey ? 0.1 : 0.02;

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'ArrowLeft') {
      updateHsv({ ...hsv, s: clamp(hsv.s - step, 0, 1) });
      return;
    }

    if (event.key === 'ArrowRight') {
      updateHsv({ ...hsv, s: clamp(hsv.s + step, 0, 1) });
      return;
    }

    if (event.key === 'ArrowUp') {
      updateHsv({ ...hsv, v: clamp(hsv.v + step, 0, 1) });
      return;
    }

    updateHsv({ ...hsv, v: clamp(hsv.v - step, 0, 1) });
  }

  // Compute popover position
  const POPOVER_WIDTH = 232;
  const POPOVER_HEIGHT = 320;
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

  const thumbX = hsv.s * 200;
  const thumbY = (1 - hsv.v) * 140;

  const currentRgba = hsvToRgba(hsv);
  const previewColor = rgbaToString({ ...currentRgba, a: hsv.a });
  const alphaGradient = `linear-gradient(to right, transparent, rgb(${currentRgba.r},${currentRgba.g},${currentRgba.b}))`;

  // --- Input handlers ---

  function handleHexCommit(raw: string) {
    const cleaned = raw.replace('#', '');
    const parsed = parseColor(`#${cleaned}`);
    if (parsed) {
      const newHsv = { ...rgbaToHsv(parsed), a: hsv.a };
      updateHsv(newHsv);
    }
  }

  function handleRgbCommit() {
    const r = clamp(parseInt(rgbInputs[0], 10) || 0, 0, 255);
    const g = clamp(parseInt(rgbInputs[1], 10) || 0, 0, 255);
    const b = clamp(parseInt(rgbInputs[2], 10) || 0, 0, 255);
    const rgba: RgbaColor = { r, g, b, a: hsv.a };
    const newHsv = rgbaToHsv(rgba);
    updateHsv(newHsv);
  }

  function handleHslCommit() {
    const h = clamp(parseInt(hslInputs[0], 10) || 0, 0, 360);
    const s = clamp(parseInt(hslInputs[1], 10) || 0, 0, 100);
    const l = clamp(parseInt(hslInputs[2], 10) || 0, 0, 100);
    const rgba = { r: 0, g: 0, b: 0, a: hsv.a };
    // Use hslaToRgba via parseColor shortcut
    const parsed = parseColor(`hsl(${h}, ${s}%, ${l}%)`);
    if (parsed) {
      const newHsv = { ...rgbaToHsv(parsed), a: hsv.a };
      updateHsv(newHsv);
    } else {
      updateHsv({ ...hsv, a: rgba.a });
    }
  }

  function handleAlphaCommit(raw: string) {
    const pct = clamp(parseFloat(raw) || 0, 0, 100);
    const newHsv = { ...hsv, a: pct / 100 };
    updateHsv(newHsv);
  }

  return (
    <div
      aria-label={`${label} color picker`}
      aria-modal="false"
      data-hawk-eye-ui="color-popover"
      id={id}
      ref={popoverRef}
      role="dialog"
      style={{ top, left, position: 'fixed' }}
    >
      {/* SV Canvas */}
      <div data-hawk-eye-ui="color-canvas-wrap">
        <canvas
          aria-label={`${label} saturation and brightness`}
          height={140}
          onPointerDown={handleCanvasPointerDown}
          onKeyDown={handleCanvasKeyDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          ref={canvasRef}
          tabIndex={0}
          width={200}
        />
        <div
          data-hawk-eye-ui="color-canvas-thumb"
          style={{ left: thumbX, top: thumbY }}
        />
      </div>

      {/* Sliders row */}
      <div data-hawk-eye-ui="color-sliders">
        <div
          data-hawk-eye-ui="color-swatch-preview"
          style={{ backgroundColor: previewColor }}
        />
        <div data-hawk-eye-ui="color-slider-stack">
          <input
            aria-label="Hue"
            data-hawk-eye-ui="hue-slider"
            max={360}
            min={0}
            onChange={(e) => {
              const newHsv = { ...hsv, h: parseInt(e.currentTarget.value, 10) };
              updateHsv(newHsv);
            }}
            step={1}
            type="range"
            value={hsv.h}
          />
          <input
            aria-label="Alpha"
            data-hawk-eye-ui="alpha-slider"
            max={100}
            min={0}
            onChange={(e) => {
              const newHsv = { ...hsv, a: parseInt(e.currentTarget.value, 10) / 100 };
              updateHsv(newHsv);
            }}
            step={1}
            style={{ '--alpha-gradient': alphaGradient } as React.CSSProperties}
            type="range"
            value={Math.round(hsv.a * 100)}
          />
        </div>
      </div>

      {/* Mode tabs */}
      <div data-hawk-eye-ui="color-tabs">
        {(['hex', 'rgb', 'hsl'] as ColorMode[]).map((m) => (
          <button
            data-active={mode === m ? 'true' : 'false'}
            data-hawk-eye-ui="color-tab"
            key={m}
            onClick={() => setMode(m)}
            type="button"
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div data-hawk-eye-ui="color-fields">
        {mode === 'hex' && (
          <>
            <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 3 }}>
              <span data-hawk-eye-ui="color-field-label">#</span>
              <input
                aria-label="Hex color"
                data-hawk-eye-ui="text-input"
                maxLength={8}
                onBlur={(e) => handleHexCommit(e.currentTarget.value)}
                onChange={(e) => setHexInput(e.currentTarget.value)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleHexCommit(hexInput); }}
                type="text"
                value={hexInput}
              />
              <span data-hawk-eye-ui="color-field-unit">Hex</span>
            </div>
            <div data-hawk-eye-ui="color-field-wrap" style={{ flex: 1 }}>
              <input
                aria-label="Alpha %"
                data-hawk-eye-ui="text-input"
                onBlur={(e) => handleAlphaCommit(e.currentTarget.value)}
                onChange={(e) => setAlphaInput(e.currentTarget.value)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAlphaCommit(alphaInput); }}
                type="text"
                value={alphaInput}
              />
              <span data-hawk-eye-ui="color-field-unit">%</span>
            </div>
          </>
        )}
        {mode === 'rgb' && (
          <>
            {(['R', 'G', 'B'] as const).map((ch, i) => (
              <div data-hawk-eye-ui="color-field-wrap" key={ch}>
                <input
                  aria-label={ch}
                  data-hawk-eye-ui="text-input"
                  maxLength={3}
                  onBlur={handleRgbCommit}
                  onChange={(e) => {
                    const next = [...rgbInputs] as [string, string, string];
                    next[i] = e.currentTarget.value;
                    setRgbInputs(next);
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRgbCommit(); }}
                  type="text"
                  value={rgbInputs[i]}
                />
                <span data-hawk-eye-ui="color-field-unit">{ch}</span>
              </div>
            ))}
            <div data-hawk-eye-ui="color-field-wrap">
              <input
                aria-label="Alpha %"
                data-hawk-eye-ui="text-input"
                onBlur={(e) => handleAlphaCommit(e.currentTarget.value)}
                onChange={(e) => setAlphaInput(e.currentTarget.value)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAlphaCommit(alphaInput); }}
                type="text"
                value={alphaInput}
              />
              <span data-hawk-eye-ui="color-field-unit">%</span>
            </div>
          </>
        )}
        {mode === 'hsl' && (
          <>
            {(['H', 'S', 'L'] as const).map((ch, i) => (
              <div data-hawk-eye-ui="color-field-wrap" key={ch}>
                <input
                  aria-label={ch}
                  data-hawk-eye-ui="text-input"
                  onBlur={handleHslCommit}
                  onChange={(e) => {
                    const next = [...hslInputs] as [string, string, string];
                    next[i] = e.currentTarget.value;
                    setHslInputs(next);
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleHslCommit(); }}
                  type="text"
                  value={hslInputs[i]}
                />
                <span data-hawk-eye-ui="color-field-unit">{ch}{i > 0 ? '%' : '°'}</span>
              </div>
            ))}
            <div data-hawk-eye-ui="color-field-wrap">
              <input
                aria-label="Alpha %"
                data-hawk-eye-ui="text-input"
                onBlur={(e) => handleAlphaCommit(e.currentTarget.value)}
                onChange={(e) => setAlphaInput(e.currentTarget.value)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAlphaCommit(alphaInput); }}
                type="text"
                value={alphaInput}
              />
              <span data-hawk-eye-ui="color-field-unit">%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
