import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { PropertiesPanel } from './PropertiesPanel';
import type { EditablePropertyId, MeasuredElement, SelectionDraft } from './types';

interface InspectorProps {
  enabled: boolean;
  hovered: MeasuredElement | null;
  pendingDrafts: SelectionDraft[];
  selected: MeasuredElement | null;
  selectedDraft: SelectionDraft | null;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onToggle(): void;
}

interface ResizeState {
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
}

const PANEL_DEFAULT_SIZE = {
  height: 760,
  width: 420,
};

const PANEL_MIN_HEIGHT = 420;
const PANEL_MIN_WIDTH = 360;
const PANEL_RESIZE_STEP = 24;
const PANEL_VIEWPORT_GUTTER = 32;
const PANEL_VERTICAL_GUTTER = 120;

function formatMeasurement(value: number) {
  return Math.max(0, Math.round(value));
}

function clampPanelSize(width: number, height: number) {
  if (typeof window === 'undefined') {
    return {
      height: Math.max(PANEL_MIN_HEIGHT, height),
      width: Math.max(PANEL_MIN_WIDTH, width),
    };
  }

  return {
    height: Math.min(
      Math.max(PANEL_MIN_HEIGHT, height),
      Math.max(PANEL_MIN_HEIGHT, window.innerHeight - PANEL_VERTICAL_GUTTER)
    ),
    width: Math.min(
      Math.max(PANEL_MIN_WIDTH, width),
      Math.max(PANEL_MIN_WIDTH, window.innerWidth - PANEL_VIEWPORT_GUTTER)
    ),
  };
}

function toOutlineStyle(measured: MeasuredElement): CSSProperties {
  return {
    height: measured.rect.height,
    left: measured.rect.left,
    top: measured.rect.top,
    width: measured.rect.width,
  };
}

function toMeasureStyle(measured: MeasuredElement): CSSProperties {
  return {
    left: measured.rect.left,
    top: Math.max(12, measured.rect.top - 36),
  };
}

export function Inspector({
  enabled,
  hovered,
  pendingDrafts,
  selected,
  selectedDraft,
  onChange,
  onResetAll,
  onResetProperty,
  onToggle,
}: InspectorProps) {
  const [panelSize, setPanelSize] = useState(PANEL_DEFAULT_SIZE);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const activeMeasurement = selected ?? hovered;
  const panelStyle = {
    '--hawk-eye-panel-height': `${panelSize.height}px`,
    '--hawk-eye-panel-width': `${panelSize.width}px`,
  } as CSSProperties;

  useEffect(() => {
    if (!enabled) {
      resizeStateRef.current = null;
      return;
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const state = resizeStateRef.current;

      if (!state) {
        return;
      }

      setPanelSize(
        clampPanelSize(
          state.startWidth + (state.startX - event.clientX),
          state.startHeight + (state.startY - event.clientY)
        )
      );
    }

    function handlePointerUp() {
      resizeStateRef.current = null;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [enabled]);

  function handleResizeKeyDown(event: KeyboardEvent<globalThis.HTMLButtonElement>) {
    let widthDelta = 0;
    let heightDelta = 0;

    switch (event.key) {
      case 'ArrowLeft':
        widthDelta = PANEL_RESIZE_STEP;
        break;
      case 'ArrowRight':
        widthDelta = -PANEL_RESIZE_STEP;
        break;
      case 'ArrowUp':
        heightDelta = PANEL_RESIZE_STEP;
        break;
      case 'ArrowDown':
        heightDelta = -PANEL_RESIZE_STEP;
        break;
      case 'Home':
        event.preventDefault();
        setPanelSize(PANEL_DEFAULT_SIZE);
        return;
      default:
        return;
    }

    event.preventDefault();
    setPanelSize((current) => clampPanelSize(current.width + widthDelta, current.height + heightDelta));
  }

  return (
    <div data-testid="hawk-eye-design-tool" data-hawk-eye-ui="root">
      <div data-hawk-eye-ui="surface">
        {enabled && activeMeasurement ? (
          <>
            <div data-hawk-eye-ui="outline" style={toOutlineStyle(activeMeasurement)} />
            <div data-hawk-eye-ui="measure" style={toMeasureStyle(activeMeasurement)}>
              {formatMeasurement(activeMeasurement.rect.width)} x{' '}
              {formatMeasurement(activeMeasurement.rect.height)}
            </div>
          </>
        ) : null}

        {enabled ? (
          <aside data-hawk-eye-ui="panel" style={panelStyle}>
            <p data-hawk-eye-ui="eyebrow">
              {selectedDraft ? 'Locked selection' : 'Inspector active'}
            </p>

            {selectedDraft ? (
              <>
                <div data-hawk-eye-ui="title-row">
                  <h2 data-hawk-eye-ui="title">{selectedDraft.tagName}</h2>
                  <span data-hawk-eye-ui="badge">{selectedDraft.styleMode}</span>
                </div>

                <dl data-hawk-eye-ui="detail-list">
                  <div data-hawk-eye-ui="detail">
                    <dt data-hawk-eye-ui="label">Source</dt>
                    <dd data-hawk-eye-ui="value">
                      {selectedDraft.file}:{selectedDraft.line}:{selectedDraft.column}
                    </dd>
                  </div>
                  <div data-hawk-eye-ui="detail">
                    <dt data-hawk-eye-ui="label">Token</dt>
                    <dd data-hawk-eye-ui="value">{selectedDraft.source}</dd>
                  </div>
                </dl>

                <PropertiesPanel
                  onChange={onChange}
                  onResetAll={onResetAll}
                  onResetProperty={onResetProperty}
                  pendingDrafts={pendingDrafts}
                  selectedDraft={selectedDraft}
                />
              </>
            ) : (
              <p data-hawk-eye-ui="hint">
                Hover any intrinsic DOM element, click to lock it, then press{' '}
                <strong>Escape</strong> or toggle the trigger to exit.
              </p>
            )}

            <button
              aria-label="Resize panel"
              data-hawk-eye-control="panel-resize"
              data-hawk-eye-ui="panel-resize"
              onKeyDown={handleResizeKeyDown}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                resizeStateRef.current = {
                  startHeight: panelSize.height,
                  startWidth: panelSize.width,
                  startX: event.clientX,
                  startY: event.clientY,
                };
              }}
              type="button"
            >
              <span data-hawk-eye-ui="panel-resize-grip" />
            </button>
          </aside>
        ) : null}

        <button data-hawk-eye-ui="trigger" onClick={onToggle} type="button">
          <span data-hawk-eye-ui="trigger-dot" />
          {enabled ? 'Exit Hawk-Eye' : 'Inspect with Hawk-Eye'}
        </button>
      </div>
    </div>
  );
}
