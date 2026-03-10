import type { CSSProperties } from 'react';
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
  onResetProperty(source: string, propertyId: EditablePropertyId): void;
  onToggle(): void;
}

function formatMeasurement(value: number) {
  return Math.max(0, Math.round(value));
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
  const activeMeasurement = selected ?? hovered;

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
          <aside data-hawk-eye-ui="panel">
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
