import { useEffect, useRef, useState, type CSSProperties } from 'react';
import triggerLogo from './assets/brand/Logo-White.svg';
import { PropertiesPanel } from './PropertiesPanel';
import type { EditablePropertyId, MeasuredElement, SaveResult, SelectionDraft, SizeAxis, SizeMode } from './types';

interface InspectorProps {
  enabled: boolean;
  hovered: MeasuredElement | null;
  pendingDrafts: SelectionDraft[];
  savePending: boolean;
  saveBlockedReason: string | null;
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

type InspectorView = 'properties' | 'changes';

const PANEL_HEIGHT = 792;
const PANEL_WIDTH = 360;
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
    return 'Syncing source…';
  }

  if (!saveResult) {
    return null;
  }

  if (saveResult.success) {
    const targetLabel =
      saveResult.modifiedFiles.length === 1
        ? saveResult.modifiedFiles[0]
        : `${saveResult.modifiedFiles.length} files`;
    const warningSuffix =
      saveResult.warnings.length > 0 ? ` ${saveResult.warnings.length} warning(s).` : '';
    return `Updated ${targetLabel}.${warningSuffix}`;
  }

  return saveResult.error;
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

export function Inspector({
  enabled,
  hovered,
  pendingDrafts,
  savePending,
  saveBlockedReason,
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
  const [panelSize] = useState(() => ({
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

  function resetDraft(draft: SelectionDraft) {
    const resetIds = new Set(getDirtyProperties(draft).map(({ resetId }) => resetId));
    resetIds.forEach((propertyId) => onResetProperty(draft.instanceKey, propertyId));
  }

  function handleResetAll() {
    if (savePending || totalChanges === 0) {
      return;
    }

    if (!window.confirm('Revert all unsaved changes?')) {
      return;
    }

    onResetAll();
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
                    <span data-hawk-eye-ui="panel-brand-mark">
                      <img alt="" data-hawk-eye-ui="panel-brand-image" src={triggerLogo} />
                    </span>
                    <span data-hawk-eye-ui="panel-brand-copy">Hawk-Eye</span>
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
                    Hover any element on the page and click to lock it. Property edits preview instantly and update source when you click Update Design.
                  </p>
                </div>
              )}
            </div>

            {view === 'changes' ? (
              <div data-hawk-eye-ui="panel-footer">
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
                  data-hawk-eye-ui="footer-revert-btn"
                  disabled={savePending || totalChanges === 0}
                  onClick={handleResetAll}
                  type="button"
                >
                  Revert
                </button>
                <button
                  data-hawk-eye-ui="footer-apply-btn"
                  disabled={savePending || Boolean(saveBlockedReason) || totalChanges === 0}
                  onClick={onSave}
                  type="button"
                >
                  {savePending ? 'Updating…' : 'Update Design'}
                </button>
              </div>
            ) : view === 'properties' && selectedDraft && totalChanges > 0 ? (
              <div data-hawk-eye-ui="panel-footer">
                <button
                  data-hawk-eye-ui="footer-revert-btn"
                  disabled={savePending || totalChanges === 0}
                  onClick={handleResetAll}
                  type="button"
                >
                  Revert
                </button>
                <button
                  data-hawk-eye-ui="footer-apply-btn"
                  disabled={savePending || Boolean(saveBlockedReason) || totalChanges === 0}
                  onClick={onSave}
                  type="button"
                >
                  {savePending ? 'Updating…' : 'Update Design'}
                </button>
              </div>
            ) : null}

            {saveStatusMessage || saveBlockedReason ? (
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
                ) : saveBlockedReason ? (
                  <p
                    aria-live="polite"
                    data-hawk-eye-ui="footer-status"
                    data-state="pending"
                    role="status"
                  >
                    {saveBlockedReason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </aside>
        ) : null}

        {!enabled ? (
          <button data-hawk-eye-ui="trigger" onClick={onToggle} type="button">
            <span data-hawk-eye-ui="trigger-brand-mark">
              <img alt="" data-hawk-eye-ui="trigger-brand-image" src={triggerLogo} />
            </span>
            <span data-hawk-eye-ui="trigger-copy">Hawk-Eye</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
