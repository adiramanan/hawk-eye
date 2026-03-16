import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PropertiesPanel } from './PropertiesPanel';
import type { EditablePropertyId, MeasuredElement, SaveResult, SelectionDraft } from './types';

interface InspectorProps {
  enabled: boolean;
  hovered: MeasuredElement | null;
  pendingDrafts: SelectionDraft[];
  savePending: boolean;
  saveResult: SaveResult | null;
  selected: MeasuredElement | null;
  selectedDraft: SelectionDraft | null;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onSave(): void;
  onToggle(): void;
}

interface DragState {
  startX: number;
  startY: number;
  startPanelX: number;
  startPanelY: number;
}

const PANEL_WIDTH = 280;
const PANEL_VIEWPORT_GUTTER = 24;

function getDefaultPanelPos() {
  if (typeof window === 'undefined') return { x: 24, y: 24 };
  return {
    x: Math.max(PANEL_VIEWPORT_GUTTER, window.innerWidth - PANEL_WIDTH - PANEL_VIEWPORT_GUTTER),
    y: PANEL_VIEWPORT_GUTTER,
  };
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

function getSaveStatusMessage(savePending: boolean, saveResult: SaveResult | null) {
  if (savePending) {
    return 'Saving…';
  }

  if (!saveResult) {
    return null;
  }

  if (saveResult.success) {
    const warningSuffix =
      saveResult.warnings.length > 0 ? ` ${saveResult.warnings.length} warning(s).` : '';
    return `Saved to ${saveResult.branch} @ ${saveResult.commitSha.slice(0, 7)}.${warningSuffix}`;
  }

  return saveResult.branch ? `${saveResult.error} (${saveResult.branch})` : saveResult.error;
}

function getDirtyProperties(draft: SelectionDraft): Array<{ id: EditablePropertyId; from: string; to: string }> {
  return (Object.entries(draft.properties) as Array<[EditablePropertyId, (typeof draft.properties)[EditablePropertyId]]>)
    .filter(([, snap]) => snap.inputValue !== '' && snap.inputValue !== snap.baseline)
    .map(([id, snap]) => ({ id, from: snap.baseline, to: snap.inputValue }));
}

export function Inspector({
  enabled,
  hovered,
  pendingDrafts,
  savePending,
  saveResult,
  selected,
  selectedDraft,
  onChange,
  onResetAll,
  onResetProperty,
  onSave,
  onToggle,
}: InspectorProps) {
  const [panelPos, setPanelPos] = useState(getDefaultPanelPos);
  const [view, setView] = useState<'properties' | 'changes'>('properties');
  const dragStateRef = useRef<DragState | null>(null);
  const activeMeasurement = selected ?? hovered;
  const saveStatusMessage = getSaveStatusMessage(savePending, saveResult);
  const totalChanges = pendingDrafts.reduce(
    (sum, d) => sum + getDirtyProperties(d).length,
    0,
  );

  useEffect(() => {
    if (pendingDrafts.length === 0) setView('properties');
  }, [pendingDrafts.length]);

  useEffect(() => {
    if (!enabled) {
      dragStateRef.current = null;
      return;
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const state = dragStateRef.current;
      if (!state) return;

      const x = state.startPanelX + (event.clientX - state.startX);
      const y = state.startPanelY + (event.clientY - state.startY);
      const clampedX = Math.max(0, Math.min(window.innerWidth - PANEL_WIDTH, x));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 56, y));
      setPanelPos({ x: clampedX, y: clampedY });
    }

    function handlePointerUp() {
      if (dragStateRef.current) {
        dragStateRef.current = null;
        document.body.style.cursor = '';
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
    };
  }, [enabled]);

  const panelStyle = {
    left: `${panelPos.x}px`,
    top: `${panelPos.y}px`,
  } as CSSProperties;

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
            {/* ── Drag header ─────────────────────────────────────── */}
            <div
              data-hawk-eye-ui="panel-drag-header"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.style.cursor = 'grabbing';
                dragStateRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  startPanelX: panelPos.x,
                  startPanelY: panelPos.y,
                };
              }}
            >
              {view === 'changes' ? (
                <button
                  aria-label="Back to properties"
                  data-hawk-eye-ui="panel-back-btn"
                  onClick={(e) => { e.stopPropagation(); setView('properties'); }}
                  type="button"
                >
                  <svg fill="none" height="10" viewBox="0 0 10 16" width="7" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1L1 8L8 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </button>
              ) : (
                <svg
                  data-hawk-eye-ui="drag-icon"
                  fill="none"
                  height="14"
                  viewBox="0 0 14 14"
                  width="14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" />
                  <path
                    d="M7 3.5V10.5M3.5 7H10.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.25"
                  />
                </svg>
              )}

              <span data-hawk-eye-ui="panel-title">
                {view === 'changes' ? 'Preview Changes' : 'Hawk-Eye'}
              </span>

              {view === 'properties' ? (
                <button
                  aria-label="Close panel"
                  data-hawk-eye-ui="panel-close-btn"
                  onClick={onToggle}
                  type="button"
                >
                  <svg fill="none" height="10" viewBox="0 0 10 10" width="10" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              ) : null}
            </div>

            {/* ── Panel body ───────────────────────────────────────── */}
            <div data-hawk-eye-ui="panel-body">
              {view === 'changes' ? (
                <div data-hawk-eye-ui="changes-view">
                  {pendingDrafts.map((draft) => {
                    const dirty = getDirtyProperties(draft);
                    if (dirty.length === 0) return null;
                    return (
                      <div data-hawk-eye-ui="change-card" key={draft.instanceKey}>
                        <div data-hawk-eye-ui="change-card-head">
                          <div data-hawk-eye-ui="change-copy">
                            <p data-hawk-eye-ui="change-title">{draft.tagName}</p>
                            <p data-hawk-eye-ui="change-source">
                              {draft.file}:{draft.line}:{draft.column}
                            </p>
                          </div>
                          <span data-hawk-eye-ui="change-count">{dirty.length}</span>
                        </div>
                        <div data-hawk-eye-ui="change-items">
                          {dirty.map(({ id, from, to }) => (
                            <div data-hawk-eye-ui="change-item" key={id}>
                              <div data-hawk-eye-ui="change-copy">
                                <span data-hawk-eye-ui="change-label">{id}</span>
                                <span data-hawk-eye-ui="change-values">
                                  {from || '—'} → {to}
                                </span>
                              </div>
                              <button
                                aria-label={`Reset ${id}`}
                                data-hawk-eye-ui="control-reset"
                                onClick={() => onResetProperty(draft.instanceKey, id)}
                                type="button"
                              >
                                ↺
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : selectedDraft ? (
                <PropertiesPanel
                  onChange={onChange}
                  onResetAll={onResetAll}
                  onResetProperty={onResetProperty}
                  pendingDrafts={pendingDrafts}
                  selectedDraft={selectedDraft}
                />
              ) : (
                <div data-hawk-eye-ui="empty-state">
                  <svg
                    data-hawk-eye-ui="empty-state-icon"
                    fill="none"
                    height="32"
                    viewBox="0 0 32 32"
                    width="32"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect height="20" rx="3" stroke="currentColor" strokeWidth="1.5" width="20" x="6" y="6" />
                    <path d="M6 12h20M12 12v14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                  </svg>
                  <p data-hawk-eye-ui="empty-state-title">No element selected</p>
                  <p data-hawk-eye-ui="empty-state-body">
                    Hover any element on the page and click to lock it. Properties will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* ── Panel footer (only when there are pending changes) ── */}
            {totalChanges > 0 ? (
              <div data-hawk-eye-ui="panel-footer">
                {view === 'changes' ? (
                  <>
                    <button
                      data-hawk-eye-control="save"
                      data-hawk-eye-ui="footer-apply-btn"
                      disabled={savePending}
                      onClick={onSave}
                      type="button"
                    >
                      {savePending ? 'Applying…' : 'Apply changes'}
                    </button>
                    <button
                      data-hawk-eye-ui="footer-revert-btn"
                      onClick={onResetAll}
                      type="button"
                    >
                      Revert
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      data-hawk-eye-ui="footer-changes-btn"
                      onClick={() => setView('changes')}
                      type="button"
                    >
                      {totalChanges} {totalChanges === 1 ? 'Change' : 'Changes'} ›
                    </button>
                    <div data-hawk-eye-ui="footer-actions">
                      <button
                        data-hawk-eye-control="save"
                        data-hawk-eye-ui="footer-apply-btn"
                        disabled={savePending}
                        onClick={onSave}
                        type="button"
                      >
                        {savePending ? '…' : 'Apply'}
                      </button>
                      <button
                        aria-label="Revert all changes"
                        data-hawk-eye-ui="footer-reset-btn"
                        onClick={onResetAll}
                        type="button"
                      >
                        <svg fill="none" height="12" viewBox="0 0 14 14" width="12" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M2 7a5 5 0 1 0 1.5-3.5L2 2v3h3L3.5 3.5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.4"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
                {saveStatusMessage ? (
                  <p
                    data-hawk-eye-ui="footer-status"
                    data-state={savePending ? 'pending' : saveResult?.success ? 'success' : 'error'}
                  >
                    {saveStatusMessage}
                  </p>
                ) : null}
              </div>
            ) : saveStatusMessage ? (
              <div data-hawk-eye-ui="panel-footer">
                <p
                  data-hawk-eye-ui="footer-status"
                  data-state={saveResult?.success ? 'success' : 'error'}
                >
                  {saveStatusMessage}
                </p>
              </div>
            ) : null}
          </aside>
        ) : null}

        {!enabled ? (
          <button data-hawk-eye-ui="trigger" onClick={onToggle} type="button">
            <span data-hawk-eye-ui="trigger-dot" />
            Inspect with Hawk-Eye
          </button>
        ) : null}
      </div>
    </div>
  );
}
