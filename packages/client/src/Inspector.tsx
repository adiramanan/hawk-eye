import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import type { EditablePropertyId, MeasuredElement, SaveResult, SelectionDraft, SizeAxis, SizeMode } from './types';

interface InspectorProps {
  enabled: boolean;
  hovered: MeasuredElement | null;
  pendingDrafts: SelectionDraft[];
  savePending: boolean;
  saveResult: SaveResult | null;
  selected: MeasuredElement | null;
  selectedDraft: SelectionDraft | null;
  selectedInstanceKey: string | null;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onChangeSizeMode(axis: SizeAxis, mode: SizeMode): void;
  onChangeSizeValue(axis: SizeAxis, value: string): void;
  onDetach(): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onSave(): void;
  onSelectByKey(instanceKey: string): void;
  onToggleAspectRatioLock(): void;
  onToggle(): void;
}

interface DragState {
  startX: number;
  startY: number;
  startPanelX: number;
  startPanelY: number;
}

interface PanelSize {
  height: number;
  width: number;
}

type InspectorView = 'properties' | 'changes' | 'layers';

const PANEL_HEIGHT = 792;
const PANEL_WIDTH = 320;
const PANEL_VIEWPORT_GUTTER = 24;

function getDefaultPanelPos() {
  if (typeof window === 'undefined') return { x: 24, y: 16 };
  return {
    x: Math.max(PANEL_VIEWPORT_GUTTER, window.innerWidth - PANEL_WIDTH - PANEL_VIEWPORT_GUTTER),
    y: 16,
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

function getDirtyProperties(
  draft: SelectionDraft
): Array<{ id: string; from: string; resetId: EditablePropertyId; to: string }> {
  const propertyChanges = (Object.entries(draft.properties) as Array<[EditablePropertyId, (typeof draft.properties)[EditablePropertyId]]>)
    .filter(([, snap]) => snap.inputValue !== '' && snap.inputValue !== snap.baseline)
    .map(([id, snap]) => ({ id, from: snap.baseline, resetId: id, to: snap.inputValue }));
  const modeChanges: Array<{ id: string; from: string; resetId: EditablePropertyId; to: string }> = [];

  if (draft.sizeControl.widthMode.value !== draft.sizeControl.widthMode.baseline) {
    modeChanges.push({
      id: 'width mode',
      from: draft.sizeControl.widthMode.baseline,
      resetId: 'width',
      to: draft.sizeControl.widthMode.value,
    });
  }

  if (draft.sizeControl.heightMode.value !== draft.sizeControl.heightMode.baseline) {
    modeChanges.push({
      id: 'height mode',
      from: draft.sizeControl.heightMode.baseline,
      resetId: 'height',
      to: draft.sizeControl.heightMode.value,
    });
  }

  return [...propertyChanges, ...modeChanges];
}

function getDraftLabel(draft: SelectionDraft) {
  const segments = draft.file.split('/');
  const basename = segments[segments.length - 1] ?? draft.file;
  return `${basename}:${draft.line}`;
}

function canDetachDraft(draft: SelectionDraft | null) {
  if (!draft || draft.detached) {
    return false;
  }

  return draft.styleMode === 'tailwind' || draft.styleMode === 'mixed';
}

function clampPanelSize(next: PanelSize) {
  if (typeof window === 'undefined') {
    return { ...next, width: PANEL_WIDTH };
  }

  return {
    height: Math.max(520, Math.min(window.innerHeight - PANEL_VIEWPORT_GUTTER, next.height)),
    width: PANEL_WIDTH,
  };
}

export function Inspector({
  enabled,
  hovered,
  pendingDrafts,
  savePending,
  saveResult,
  selected,
  selectedDraft,
  selectedInstanceKey,
  onChange,
  onChangeSizeMode,
  onChangeSizeValue,
  onDetach,
  onResetAll,
  onResetProperty,
  onSave,
  onSelectByKey,
  onToggleAspectRatioLock,
  onToggle,
}: InspectorProps) {
  const [panelPos, setPanelPos] = useState(getDefaultPanelPos);
  const [panelSize, setPanelSize] = useState<PanelSize>(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight - 64 : PANEL_HEIGHT,
    width: PANEL_WIDTH,
  }));
  const [view, setView] = useState<InspectorView>('properties');
  const dragStateRef = useRef<DragState | null>(null);
  const activeMeasurement = selected ?? hovered;
  const saveStatusMessage = getSaveStatusMessage(savePending, saveResult);
  const totalChanges = pendingDrafts.reduce(
    (sum, d) => sum + getDirtyProperties(d).length,
    0,
  );
  const showDetach = canDetachDraft(selectedDraft);
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
      const clampedX = Math.max(
        0,
        Math.min(window.innerWidth - panelSize.width - PANEL_VIEWPORT_GUTTER, x)
      );
      const clampedY = Math.max(
        0,
        Math.min(window.innerHeight - panelSize.height - PANEL_VIEWPORT_GUTTER, y)
      );
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
  }, [enabled, panelSize.height, panelSize.width]);

  const panelStyle = {
    '--hawk-eye-panel-height': `${panelSize.height}px`,
    '--hawk-eye-panel-width': `${panelSize.width}px`,
    left: `${panelPos.x}px`,
    top: `${panelPos.y}px`,
  } as CSSProperties;

  function adjustPanelSize(widthDelta: number, heightDelta: number) {
    setPanelSize((current) =>
      clampPanelSize({
        height: current.height + heightDelta,
        width: current.width + widthDelta,
      })
    );
  }

  function resetDraft(draft: SelectionDraft) {
    const resetIds = new Set(getDirtyProperties(draft).map(({ resetId }) => resetId));
    resetIds.forEach((propertyId) => onResetProperty(draft.instanceKey, propertyId));
  }

  function handleResetAll() {
    if (totalChanges === 0) {
      return;
    }

    if (!window.confirm('Revert all unsaved changes?')) {
      return;
    }

    onResetAll();
  }

  function renderTabIcon(tab: 'properties' | 'layers') {
    if (tab === 'properties') {
      return (
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.2 2.2h9.6v9.6H2.2zM5 4.6h4M5 7h4M5 9.4h2.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
        </svg>
      );
    }

    return (
      <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 1.8L11.8 4.4L7 7L2.2 4.4L7 1.8ZM2.2 6.8L7 9.4L11.8 6.8M2.2 9.2L7 11.8L11.8 9.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  function renderBrandMark() {
    return (
      <svg fill="none" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" opacity="0.18" r="8" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M9 2.8L10.5 5.4L13.4 6L11.4 8.1L11.8 11L9 9.6L6.2 11L6.6 8.1L4.6 6L7.5 5.4L9 2.8Z"
          fill="currentColor"
        />
      </svg>
    );
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
                  aria-label="Back"
                  data-hawk-eye-ui="panel-back-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setView('properties');
                  }}
                  type="button"
                >
                  <svg fill="none" height="10" viewBox="0 0 10 16" width="7" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1L1 8L8 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </button>
              ) : (
                <span data-hawk-eye-ui="panel-leading-spacer" />
              )}

              <span data-hawk-eye-ui="panel-title">
                {view === 'changes' ? (
                  'Changes Done'
                ) : (
                  <span data-hawk-eye-ui="panel-brand">
                    <span data-hawk-eye-ui="panel-brand-mark">{renderBrandMark()}</span>
                    <span data-hawk-eye-ui="panel-brand-copy">CraftKit</span>
                  </span>
                )}
              </span>

              {view === 'changes' ? (
                <span data-hawk-eye-ui="panel-leading-spacer" />
              ) : (
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
              )}
            </div>

            {view !== 'changes' && (
              <div data-hawk-eye-ui="panel-tabs">
                <button
                  data-active={view === 'layers' ? 'true' : 'false'}
                  data-hawk-eye-ui="panel-tab"
                  onClick={() => setView('layers')}
                  type="button"
                >
                  <span data-hawk-eye-ui="panel-tab-icon">{renderTabIcon('layers')}</span>
                  Layers
                </button>
                <button
                  data-active={view === 'properties' ? 'true' : 'false'}
                  data-hawk-eye-ui="panel-tab"
                  onClick={() => setView('properties')}
                  type="button"
                >
                  <span data-hawk-eye-ui="panel-tab-icon">{renderTabIcon('properties')}</span>
                  Properties
                </button>
              </div>
            )}

            {selectedDraft && view !== 'changes' && showDetach ? (
              <div data-hawk-eye-ui="panel-meta">
                <button
                  data-hawk-eye-control="detach"
                  data-hawk-eye-ui="panel-meta-btn"
                  onClick={onDetach}
                  type="button"
                >
                  Detach
                </button>
              </div>
            ) : null}

            <div data-hawk-eye-ui="panel-body">
              {view === 'changes' ? (
                <div data-hawk-eye-ui="changes-view">
                  {pendingDrafts.map((draft) => {
                    const dirty = getDirtyProperties(draft);
                    if (dirty.length === 0) return null;
                    return (
                      <div data-hawk-eye-ui="changes-card" key={draft.instanceKey}>
                        <div data-hawk-eye-ui="changes-card-header">
                          <div data-hawk-eye-ui="changes-card-copy">
                            <p data-hawk-eye-ui="changes-card-source">{getDraftLabel(draft)}</p>
                            <span data-hawk-eye-ui="changes-card-tag">{draft.tagName}</span>
                          </div>
                          <div data-hawk-eye-ui="changes-card-actions">
                            <span data-hawk-eye-ui="changes-count">{dirty.length}</span>
                            <button
                              aria-label={`Reset ${draft.tagName}`}
                              data-hawk-eye-ui="changes-reset-btn"
                              onClick={() => resetDraft(draft)}
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
                        </div>
                        <div data-hawk-eye-ui="changes-card-body">
                          {dirty.map(({ id, from, to }) => (
                            <div data-hawk-eye-ui="changes-card-row" key={id}>
                              <span data-hawk-eye-ui="changes-card-label">{id} :</span>
                              <span data-hawk-eye-ui="changes-card-value">{to || from || '—'}</span>
                            </div>
                          ))}
                        </div>
                        {selectedDraft?.instanceKey === draft.instanceKey ? (
                          <div data-hawk-eye-ui="changes-card-overlay">
                            <div data-hawk-eye-ui="changes-overlay-actions">
                              <button
                                data-hawk-eye-ui="overlay-reset-btn"
                                onClick={() => resetDraft(draft)}
                                type="button"
                              >
                                Reset
                              </button>
                              <button
                                data-hawk-eye-ui="overlay-keep-btn"
                                onClick={() => setView('properties')}
                                type="button"
                              >
                                Keep
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : view === 'layers' ? (
                <LayersPanel
                  selectedInstanceKey={selectedInstanceKey}
                  onSelectByKey={onSelectByKey}
                />
              ) : selectedDraft ? (
                <PropertiesPanel
                  context={selectedDraft.context}
                  onChange={onChange}
                  onChangeSizeMode={onChangeSizeMode}
                  onChangeSizeValue={onChangeSizeValue}
                  onResetAll={onResetAll}
                  onResetProperty={onResetProperty}
                  onToggleAspectRatioLock={onToggleAspectRatioLock}
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

            {view === 'changes' ? (
              <div data-hawk-eye-ui="panel-footer">
                <button
                  data-hawk-eye-control="save"
                  data-hawk-eye-ui="footer-apply-btn"
                  disabled={savePending || totalChanges === 0}
                  onClick={onSave}
                  type="button"
                >
                  {savePending ? 'Applying…' : 'Apply changes'}
                </button>
                <button
                  aria-label="Back to properties"
                  data-hawk-eye-ui="footer-icon-btn"
                  onClick={() => setView('properties')}
                  type="button"
                >
                  <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2 8s2.2-3.5 6-3.5S14 8 14 8s-2.2 3.5-6 3.5S2 8 2 8Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path d="M1.5 1.5 14.5 14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
                  </svg>
                </button>
                <button
                  aria-label="Revert all changes"
                  data-hawk-eye-ui="footer-icon-btn"
                  onClick={handleResetAll}
                  type="button"
                >
                  <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 8a5 5 0 1 0 1.5-3.5L3 3v3h3L4.5 4.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>
              </div>
            ) : view === 'properties' && selectedDraft ? (
              <div data-hawk-eye-ui="panel-footer">
                <button
                  data-hawk-eye-control="save"
                  data-hawk-eye-ui="footer-apply-btn"
                  disabled={savePending || totalChanges === 0}
                  onClick={onSave}
                  type="button"
                >
                  {savePending ? 'Applying…' : 'Apply changes'}
                </button>
                <button
                  data-hawk-eye-ui="footer-revert-btn"
                  disabled={totalChanges === 0}
                  onClick={handleResetAll}
                  type="button"
                >
                  Revert
                </button>
              </div>
            ) : view === 'layers' && totalChanges > 0 ? (
              <div data-hawk-eye-ui="panel-footer">
                <button
                  data-hawk-eye-ui="footer-changes-btn"
                  onClick={() => setView('changes')}
                  type="button"
                >
                  {totalChanges} {totalChanges === 1 ? 'Change' : 'Changes'} ›
                </button>
              </div>
            ) : null}

            {saveStatusMessage ? (
              <div data-hawk-eye-ui="panel-footer-status">
                {saveStatusMessage ? (
                  <p
                    aria-live="polite"
                    data-hawk-eye-ui="footer-status"
                    data-state={savePending ? 'pending' : saveResult?.success ? 'success' : 'error'}
                    role="status"
                  >
                    {saveStatusMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              aria-label="Resize panel"
              data-hawk-eye-control="panel-resize"
              data-hawk-eye-ui="panel-resize"
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  adjustPanelSize(24, 0);
                } else if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  adjustPanelSize(-24, 0);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  adjustPanelSize(0, -24);
                } else if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  adjustPanelSize(0, 24);
                }
              }}
              type="button"
            />
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
