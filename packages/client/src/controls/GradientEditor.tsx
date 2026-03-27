import { useState } from 'react';
import type { PropertySnapshot } from '../types';
import {
  parseGradient,
  composeGradient,
  type GradientConfig,
  type LinearGradientConfig,
  type RadialGradientConfig,
  type ConicGradientConfig,
  type GradientType,
} from '../utils/gradient-parser';
import { parseColor, rgbaToHex } from '../utils/color';

interface GradientEditorProps {
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

const GRADIENT_TYPES: Array<{ label: string; value: GradientType }> = [
  { label: 'Linear', value: 'linear' },
  { label: 'Radial', value: 'radial' },
  { label: 'Conic', value: 'conic' },
  { label: 'Repeating Linear', value: 'repeating-linear' },
  { label: 'Repeating Radial', value: 'repeating-radial' },
  { label: 'Repeating Conic', value: 'repeating-conic' },
];

const DEFAULT_GRADIENT_STOP_1 = '#ff0000';
const DEFAULT_GRADIENT_STOP_2 = '#0000ff';

function isLinearConfig(cfg: GradientConfig): cfg is LinearGradientConfig {
  return cfg.type === 'linear' || cfg.type === 'repeating-linear';
}

function isRadialConfig(cfg: GradientConfig): cfg is RadialGradientConfig {
  return cfg.type === 'radial' || cfg.type === 'repeating-radial';
}

function isConicConfig(cfg: GradientConfig): cfg is ConicGradientConfig {
  return cfg.type === 'conic' || cfg.type === 'repeating-conic';
}

function createDefaultGradient(): LinearGradientConfig {
  return {
    type: 'linear',
    angle: 90,
    stops: [
      { color: DEFAULT_GRADIENT_STOP_1, position: 0 },
      { color: DEFAULT_GRADIENT_STOP_2, position: 100 },
    ],
  };
}

function normalizeColorDisplay(value: string): string {
  const parsed = parseColor(value);
  if (parsed) {
    return rgbaToHex(parsed);
  }
  return value;
}

export function GradientEditor({ snapshot, onChange }: GradientEditorProps) {
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);

  const parsed = parseGradient(snapshot.inputValue || snapshot.baseline || '') || createDefaultGradient();
  const [config, setConfig] = useState<GradientConfig>(parsed);

  // Extract variant-specific properties with safe defaults for cross-type access
  const currentAngle = isLinearConfig(config) ? config.angle ?? 90 : 90;
  const currentShape = isRadialConfig(config) ? config.shape ?? 'ellipse' : 'ellipse';
  const currentPosX = isRadialConfig(config) ? config.positionX ?? 50
    : isConicConfig(config) ? config.positionX ?? 50 : 50;
  const currentPosY = isRadialConfig(config) ? config.positionY ?? 50
    : isConicConfig(config) ? config.positionY ?? 50 : 50;
  const currentRotation = isConicConfig(config) ? config.rotation ?? 0 : 0;

  function updateConfig(newConfig: GradientConfig) {
    setConfig(newConfig);
    onChange(composeGradient(newConfig));
  }

  function updateType(type: GradientType) {
    if (type === 'linear' || type === 'repeating-linear') {
      updateConfig({ type, angle: currentAngle, stops: config.stops });
    } else if (type === 'radial' || type === 'repeating-radial') {
      updateConfig({ type, shape: currentShape, positionX: currentPosX, positionY: currentPosY, stops: config.stops });
    } else if (type === 'conic' || type === 'repeating-conic') {
      updateConfig({ type, rotation: currentRotation, positionX: currentPosX, positionY: currentPosY, stops: config.stops });
    }
  }

  function updateStopColor(index: number, color: string) {
    const newStops = [...config.stops];
    newStops[index] = { ...newStops[index], color };
    updateConfig({ ...config, stops: newStops });
  }

  function updateStopPosition(index: number, position: number) {
    const newStops = [...config.stops];
    newStops[index] = { ...newStops[index], position };
    updateConfig({ ...config, stops: newStops.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) });
  }

  function addStop() {
    const newStops = [...config.stops];
    const lastStop = newStops[newStops.length - 1];
    const newPosition = Math.min(100, (lastStop.position ?? 100) + 10);
    newStops.push({ color: lastStop.color, position: newPosition });
    updateConfig({ ...config, stops: newStops });
  }

  function removeStop(index: number) {
    if (config.stops.length <= 2) return; // Keep at least 2 stops
    const newStops = config.stops.filter((_, i) => i !== index);
    updateConfig({ ...config, stops: newStops });
  }

  function updateAngle(angle: number) {
    if (isLinearConfig(config)) {
      updateConfig({ ...config, angle });
    }
  }

  function updateRadialPosition(posX: number, posY: number) {
    if (isRadialConfig(config)) {
      updateConfig({ ...config, positionX: posX, positionY: posY });
    }
  }

  function updateConicRotation(rotation: number) {
    if (isConicConfig(config)) {
      updateConfig({ ...config, rotation });
    }
  }

  function updateConicPosition(posX: number, posY: number) {
    if (isConicConfig(config)) {
      updateConfig({ ...config, positionX: posX, positionY: posY });
    }
  }

  // Create a preview gradient CSS
  const previewCss = composeGradient(config);

  return (
    <div data-hawk-eye-ui="gradient-editor">
      {/* Gradient Preview */}
      <div
        data-hawk-eye-ui="gradient-preview"
        style={{
          background: previewCss,
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--spacing-md)',
          border: '1px solid var(--color-border)',
        }}
      />

      {/* Gradient Type Selector */}
      <div data-hawk-eye-ui="gradient-field">
        <label data-hawk-eye-ui="field-label">Type</label>
        <select
          aria-label="Gradient type"
          data-hawk-eye-control="gradient-type"
          data-hawk-eye-ui="select-input"
          onChange={(e) => updateType(e.currentTarget.value as GradientType)}
          value={config.type}
        >
          {GRADIENT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Angle Control for Linear Gradients */}
      {isLinearConfig(config) && (
        <div data-hawk-eye-ui="gradient-field">
          <label data-hawk-eye-ui="field-label">Angle</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-base)' }}>
            <input
              aria-label="Gradient angle"
              data-hawk-eye-control="gradient-angle"
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateAngle(parseFloat(e.currentTarget.value) || 0)}
              type="number"
              value={currentAngle}
              min="0"
              max="360"
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={currentAngle}
            onChange={(e) => updateAngle(parseInt(e.currentTarget.value))}
            style={{ width: '100%', marginTop: 'var(--spacing-xs)' }}
          />
        </div>
      )}

      {/* Position Controls for Radial Gradients */}
      {isRadialConfig(config) && (
        <>
          <div data-hawk-eye-ui="gradient-field">
            <label data-hawk-eye-ui="field-label">Position X</label>
            <input
              aria-label="Radial gradient position X"
              data-hawk-eye-control="gradient-posX"
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateRadialPosition(parseFloat(e.currentTarget.value) || 50, currentPosY)}
              type="number"
              value={currentPosX}
              min="0"
              max="100"
            />
          </div>
          <div data-hawk-eye-ui="gradient-field">
            <label data-hawk-eye-ui="field-label">Position Y</label>
            <input
              aria-label="Radial gradient position Y"
              data-hawk-eye-control="gradient-posY"
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateRadialPosition(currentPosX, parseFloat(e.currentTarget.value) || 50)}
              type="number"
              value={currentPosY}
              min="0"
              max="100"
            />
          </div>
        </>
      )}

      {/* Rotation Control for Conic Gradients */}
      {isConicConfig(config) && (
        <>
          <div data-hawk-eye-ui="gradient-field">
            <label data-hawk-eye-ui="field-label">Rotation</label>
            <input
              aria-label="Conic gradient rotation"
              data-hawk-eye-control="gradient-rotation"
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateConicRotation(parseFloat(e.currentTarget.value) || 0)}
              type="number"
              value={currentRotation}
              min="0"
              max="360"
            />
          </div>
          <div data-hawk-eye-ui="gradient-field">
            <label data-hawk-eye-ui="field-label">Position X</label>
            <input
              aria-label="Conic gradient position X"
              data-hawk-eye-control="gradient-conic-posX"
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateConicPosition(parseFloat(e.currentTarget.value) || 50, currentPosY)}
              type="number"
              value={currentPosX}
              min="0"
              max="100"
            />
          </div>
          <div data-hawk-eye-ui="gradient-field">
            <label data-hawk-eye-ui="field-label">Position Y</label>
            <input
              aria-label="Conic gradient position Y"
              data-hawk-eye-control="gradient-conic-posY"
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateConicPosition(currentPosX, parseFloat(e.currentTarget.value) || 50)}
              type="number"
              value={currentPosY}
              min="0"
              max="100"
            />
          </div>
        </>
      )}

      {/* Color Stops */}
      <div data-hawk-eye-ui="gradient-stops">
        <label data-hawk-eye-ui="field-label">Color Stops</label>
        {config.stops.map((stop, index) => (
          <div key={index} data-hawk-eye-ui="color-stop" style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', marginBottom: 'var(--spacing-base)' }}>
            {/* Color Swatch */}
            <button
              onClick={() => setEditingStopIndex(editingStopIndex === index ? null : index)}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: stop.color,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Click to edit color"
            />

            {/* Color Editor Popup */}
            {editingStopIndex === index && (
              <div style={{ position: 'absolute', zIndex: 1000 }}>
                <input
                  type="text"
                  value={normalizeColorDisplay(stop.color)}
                  onChange={(e) => updateStopColor(index, e.currentTarget.value)}
                  data-hawk-eye-ui="text-input"
                  style={{ width: '80px' }}
                />
              </div>
            )}

            {/* Position Input */}
            <input
              aria-label={`Stop ${index + 1} position`}
              data-hawk-eye-control={`gradient-stop-${index}-position`}
              data-hawk-eye-ui="text-input"
              onChange={(e) => updateStopPosition(index, parseFloat(e.currentTarget.value) || 0)}
              type="number"
              value={stop.position ?? 0}
              min="0"
              max="100"
              style={{ width: '50px' }}
            />
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>%</span>

            {/* Remove Button */}
            {config.stops.length > 2 && (
              <button
                onClick={() => removeStop(index)}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-base)',
                  fontSize: 'var(--font-size-sm)',
                  cursor: 'pointer',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* Add Stop Button */}
        <button
          onClick={addStop}
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            marginTop: 'var(--spacing-base)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          + Add Stop
        </button>
      </div>
    </div>
  );
}
