import React, { startTransition, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../../../shared/protocol';
import { editablePropertyDefinitionMap, FOCUSED_PROPERTY_IDS } from './editable-properties';
import {
  applyDraftInputValue,
  applyDraftToElement,
  clearDraftOverrides,
  createInspectableElementKey,
  createSelectionDraft,
  detachDraft,
  getDirtyPropertyIds,
  getDirtySizeModes,
  getDirtyDrafts,
  getInspectableElementByKey,
  hasDraftChanges,
  mergeSelectionDraft,
  resetDraftProperty,
  resetDraftSizeMode,
} from './drafts';
import {
  Inspector,
  type InspectorMotionTimings,
  type InspectorShellState,
  type ToggleIntent,
} from './Inspector';
import {
  formatSizeValue,
  getNumericMemoryValue,
  getSizeUnitsForMode,
  isNumericSizeMode,
  updateSizeModeMemory,
} from './size-state';
import { hawkEyeStyles } from './styles';
import type {
  AuthoredClassTarget,
  EditablePropertyId,
  MeasuredElement,
  SavePayload,
  SaveResult,
  SelectionDetails,
  SelectionDraft,
  SelectionPayload,
  SizeAxis,
  SizeControlState,
  SizeMode,
  StyleAnalysisPayload,
} from './types';
import { parseColor, rgbaToHex } from './utils/color';
import { parseCssValue } from './utils/css-value';
import {
  requestSave,
  requestSelection,
  requestStyleAnalysis,
  subscribeToSaveResult,
  subscribeToSelection,
  subscribeToStyleAnalysis,
} from './ws-client';

export interface DesignToolProps {
  // Phase 2 keeps the public API zero-config.
}

type PendingSavePayload = Omit<SavePayload, 'clientId'>;

const SHELL_HANDOFF_DURATION_MS = 220;
const VIEW_TRANSITION_DURATION_MS = 180;
const STATUS_TRANSITION_DURATION_MS = 160;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const BORDER_WIDTH_PROPERTY_IDS = new Set<EditablePropertyId>([
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
]);
const CLASS_TARGET_PREVIEW_STYLE_ID = 'hawk-eye-class-target-preview-style';
let classTargetPreviewStyleElement: HTMLStyleElement | null = null;
let lastClassTargetPreviewCss = '';

function isTestRuntime() {
  const runtimeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process;

  return (
    runtimeProcess?.env?.NODE_ENV === 'test' ||
    runtimeProcess?.env?.VITEST === 'true'
  );
}

function getActiveClassTarget(draft: SelectionDraft): AuthoredClassTarget | null {
  if (draft.detached || draft.classTargets.length === 0) {
    return null;
  }

  return (
    draft.classTargets.find((target) => target.id === draft.activeClassTargetId) ??
    draft.classTargets[0] ??
    null
  );
}

function getClassTargetSourceLocation(draft: SelectionDraft) {
  return {
    file: draft.file,
    line: draft.line,
    column: draft.column,
  };
}

function getClassTargetPreviewStyleElement() {
  if (typeof document === 'undefined') {
    return null;
  }

  if (classTargetPreviewStyleElement?.isConnected) {
    return classTargetPreviewStyleElement;
  }

  const existing = document.getElementById(CLASS_TARGET_PREVIEW_STYLE_ID);

  if (existing instanceof HTMLStyleElement) {
    classTargetPreviewStyleElement = existing;
    return existing;
  }

  const styleElement = document.createElement('style');
  styleElement.id = CLASS_TARGET_PREVIEW_STYLE_ID;
  styleElement.setAttribute('data-hawk-eye-ui', 'class-target-preview-style');
  (document.head ?? document.documentElement).append(styleElement);
  classTargetPreviewStyleElement = styleElement;
  return styleElement;
}

function clearClassTargetPreview() {
  const styleElement = getClassTargetPreviewStyleElement();

  if (!styleElement) {
    return;
  }

  styleElement.textContent = '';
  lastClassTargetPreviewCss = '';
}

function getClassTargetPreviewCssProperty(propertyId: EditablePropertyId, value: string) {
  const definition = editablePropertyDefinitionMap[propertyId];

  if (
    propertyId === 'backgroundColor' &&
    /(?:gradient\(|url\()/i.test(value.trim())
  ) {
    return 'background';
  }

  return definition?.cssProperty ?? '';
}

function renderAllClassTargetPreview(drafts: SelectionDraft[]) {
  const styleElement = getClassTargetPreviewStyleElement();

  if (!styleElement) {
    return;
  }

  if (drafts.length === 0) {
    styleElement.textContent = '';
    lastClassTargetPreviewCss = '';
    return;
  }

  // Merge edits across every active class target so selection changes don't
  // accidentally clear preview styles for peer elements.
  const declarationsBySelector = new Map<string, Map<string, string>>();

  for (const draft of drafts) {
    const target = getActiveClassTarget(draft);
    if (!target) continue;

    const dirtyPropertyIds = getDirtyPropertyIds(draft);
    if (dirtyPropertyIds.length === 0) continue;

    let cssPropertyMap = declarationsBySelector.get(target.selector);
    if (!cssPropertyMap) {
      cssPropertyMap = new Map<string, string>();
      declarationsBySelector.set(target.selector, cssPropertyMap);
    }

    for (const propertyId of dirtyPropertyIds) {
      const snapshot = draft.properties[propertyId];
      const cssProperty = getClassTargetPreviewCssProperty(propertyId, snapshot.value);
      if (!cssProperty) continue;

      cssPropertyMap.set(cssProperty, snapshot.value);
    }
  }

  const blocks = Array.from(declarationsBySelector.entries()).map(([selector, cssProps]) => {
    const declarations = Array.from(cssProps.entries()).map(
      ([cssProperty, value]) => `  ${cssProperty}: ${value} !important;`
    );
    return declarations.length > 0 ? `${selector} {\n${declarations.join('\n')}\n}` : '';
  });

  const nextCss = blocks.filter(Boolean).join('\n');
  // Always re-assign for consistent CSSOM recomputation (notably in jsdom).
  styleElement.textContent = nextCss;
  lastClassTargetPreviewCss = nextCss;
}

function renderDraftPreview(draft: SelectionDraft) {
  const element = getInspectableElementByKey(draft.instanceKey);

  if (!element) {
    return;
  }

  applyDraftToElement(element, draft);
}

function buildSavePayload(drafts: SelectionDraft[]): PendingSavePayload {
  const capability = drafts.find((draft) => draft.saveCapability)?.saveCapability;
  const mutations: PendingSavePayload['mutations'] = [];

  for (const draft of drafts) {
    const classTarget = getActiveClassTarget(draft);
    const propertyIds = draft.detached ? Array.from(FOCUSED_PROPERTY_IDS) : getDirtyPropertyIds(draft);
    const sizeModeMetadata = classTarget ? null : getDirtySizeModes(draft);
    const properties = propertyIds.map((propertyId) => ({
      propertyId,
      oldValue: draft.properties[propertyId].baseline,
      newValue: draft.properties[propertyId].value,
    }));

    if (properties.length === 0 && !sizeModeMetadata?.width && !sizeModeMetadata?.height) {
      continue;
    }

    mutations.push({
      file: classTarget?.file ?? draft.file,
      line: classTarget?.line ?? draft.line,
      column: classTarget?.column ?? draft.column,
      detached: draft.detached,
      fingerprint: draft.analysisFingerprint,
      sourceLocation: getClassTargetSourceLocation(draft),
      ...(classTarget ? { classTarget } : {}),
      properties,
      ...(sizeModeMetadata?.width || sizeModeMetadata?.height ? { sizeModeMetadata } : {}),
    });
  }

  return {
    capability: capability ?? '',
    mutations,
  };
}

function mutationMatchesDraft(
  draft: SelectionDraft,
  mutation: PendingSavePayload['mutations'][number]
) {
  const sourceLocation = mutation.sourceLocation ?? {
    file: mutation.file,
    line: mutation.line,
    column: mutation.column,
  };

  return (
    draft.file === sourceLocation.file &&
    draft.line === sourceLocation.line &&
    draft.column === sourceLocation.column
  );
}

function commitPersistedPropertySnapshot(
  snapshot: SelectionDraft['properties'][EditablePropertyId],
  persistedValue: string
) {
  if (snapshot.invalid) {
    return {
      ...snapshot,
      baseline: persistedValue,
      inlineValue: persistedValue,
    };
  }

  if (snapshot.value !== persistedValue) {
    return {
      ...snapshot,
      baseline: persistedValue,
      inlineValue: persistedValue,
    };
  }

  return {
    ...snapshot,
    baseline: persistedValue,
    inlineValue: persistedValue,
    inputValue: persistedValue,
    invalid: false,
    value: persistedValue,
  };
}

function commitPersistedSizeModeSnapshot(
  snapshot: SizeControlState['widthMode'],
  persistedValue: SizeMode
) {
  if (snapshot.value !== persistedValue) {
    return {
      ...snapshot,
      baseline: persistedValue,
      inlineValue: persistedValue,
    };
  }

  return {
    ...snapshot,
    baseline: persistedValue,
    inlineValue: persistedValue,
    value: persistedValue,
  };
}

function commitPersistedDrafts(
  currentDrafts: Record<string, SelectionDraft>,
  payload: PendingSavePayload
) {
  let changed = false;
  const nextDrafts = { ...currentDrafts };

  for (const [instanceKey, draft] of Object.entries(currentDrafts)) {
    const matchingMutation = payload.mutations.find((mutation) =>
      mutationMatchesDraft(draft, mutation)
    );

    if (!matchingMutation) {
      continue;
    }

    changed = true;
    let nextSizeControl = draft.sizeControl;
    let nextProperties = draft.properties;

    for (const propertyMutation of matchingMutation.properties) {
      const propertyId = propertyMutation.propertyId as EditablePropertyId;
      const currentSnapshot = nextProperties[propertyId];

      if (!currentSnapshot) {
        continue;
      }

      nextProperties = {
        ...nextProperties,
        [propertyId]: commitPersistedPropertySnapshot(currentSnapshot, propertyMutation.newValue),
      };
    }

    if (matchingMutation.sizeModeMetadata?.width) {
      nextSizeControl = {
        ...nextSizeControl,
        widthMode: commitPersistedSizeModeSnapshot(
          nextSizeControl.widthMode,
          matchingMutation.sizeModeMetadata.width
        ),
      };
    }

    if (matchingMutation.sizeModeMetadata?.height) {
      nextSizeControl = {
        ...nextSizeControl,
        heightMode: commitPersistedSizeModeSnapshot(
          nextSizeControl.heightMode,
          matchingMutation.sizeModeMetadata.height
        ),
      };
    }

    nextDrafts[instanceKey] = {
      ...draft,
      analysisFingerprint: '',
      properties: nextProperties,
      sizeControl: nextSizeControl,
      styleAnalysisResolved: false,
    };
  }

  return changed ? nextDrafts : currentDrafts;
}

function collectMutationSources(
  currentDrafts: Record<string, SelectionDraft>,
  payload: PendingSavePayload
) {
  const sources = new Set<string>();

  for (const draft of Object.values(currentDrafts)) {
    if (payload.mutations.some((mutation) => mutationMatchesDraft(draft, mutation))) {
      sources.add(draft.source);
    }
  }

  return Array.from(sources);
}

function hasInvalidCapabilityWarning(payload: SaveResult) {
  return (
    !payload.success && payload.warnings.some((warning) => warning.code === 'invalid-capability')
  );
}

function parseSourceToken(source: string) {
  const match = /^(.*):(\d+):(\d+)(?::[a-f0-9]+)?$/.exec(source);

  if (!match) {
    return null;
  }

  const [, file, rawLine, rawColumn] = match;
  const line = Number.parseInt(rawLine, 10);
  const column = Number.parseInt(rawColumn, 10);

  if (!file || !Number.isInteger(line) || !Number.isInteger(column)) {
    return null;
  }

  return {
    file,
    line,
    column,
  };
}

function isHawkEyeElement(target: Element | null) {
  return Boolean(target?.closest('[data-hawk-eye-ui]'));
}

function measureElement(element: HTMLElement | null) {
  if (!element) {
    return null;
  }

  const source = element.dataset.hawkEyeSource;

  if (!source) {
    return null;
  }

  const instanceKey = createInspectableElementKey(element);

  if (!instanceKey) {
    return null;
  }

  return {
    element,
    instanceKey,
    rect: element.getBoundingClientRect(),
    source,
  } satisfies MeasuredElement;
}

function measureElementByKey(instanceKey: string) {
  return measureElement(getInspectableElementByKey(instanceKey));
}

function sameMeasuredElement(current: MeasuredElement | null, next: MeasuredElement | null) {
  return current?.element === next?.element && current?.instanceKey === next?.instanceKey;
}

function getAxisPropertyId(axis: SizeAxis): EditablePropertyId {
  return axis;
}

function isBorderWidthPropertyId(propertyId: EditablePropertyId) {
  return BORDER_WIDTH_PROPERTY_IDS.has(propertyId);
}

function getSnapshotDisplayValue(
  snapshot: SelectionDraft['properties'][EditablePropertyId]
) {
  return snapshot.inputValue || snapshot.value || snapshot.baseline;
}

function getVisibleBorderColor(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const borderSides = [
    ['borderTopWidth', 'borderTopColor', 'border-top-width', 'border-top-color'],
    ['borderRightWidth', 'borderRightColor', 'border-right-width', 'border-right-color'],
    ['borderBottomWidth', 'borderBottomColor', 'border-bottom-width', 'border-bottom-color'],
    ['borderLeftWidth', 'borderLeftColor', 'border-left-width', 'border-left-color'],
  ] as const;

  for (const [widthKey, colorKey, widthProperty, colorProperty] of borderSides) {
    const width =
      parseCssValue(element.style[widthKey].trim()) ??
      parseCssValue(element.style.getPropertyValue(widthProperty).trim()) ??
      parseCssValue(computedStyle.getPropertyValue(widthProperty).trim());

    if (width && width.number > 0) {
      const inlineColor =
        element.style[colorKey].trim() || element.style.getPropertyValue(colorProperty).trim();
      const computedColor = computedStyle.getPropertyValue(colorProperty).trim();
      const color = parseColor(inlineColor) ? inlineColor : computedColor;

      if (parseColor(color)) {
        return color;
      }
    }
  }

  return null;
}

function areColorsEquivalent(left: string, right: string) {
  const parsedLeft = parseColor(left);
  const parsedRight = parseColor(right);

  if (!parsedLeft || !parsedRight) {
    return false;
  }

  return rgbaToHex(parsedLeft) === rgbaToHex(parsedRight);
}

function getOppositeAxis(axis: SizeAxis): SizeAxis {
  return axis === 'width' ? 'height' : 'width';
}

function getMeasuredAxisSize(measured: DOMRect, axis: SizeAxis) {
  return axis === 'width' ? measured.width : measured.height;
}

function getSizeSnapshotValue(draft: SelectionDraft, axis: SizeAxis) {
  const propertyId = getAxisPropertyId(axis);
  const snapshot = draft.properties[propertyId];
  return (snapshot.inputValue || snapshot.value).trim();
}

function getNumericSizeValueFromDraft(
  draft: SelectionDraft,
  axis: SizeAxis,
  measuredRect: DOMRect
) {
  const mode = getSizeModeSnapshot(draft.sizeControl, axis).value;

  if (!isNumericSizeMode(mode)) {
    return null;
  }

  const parsedSnapshotValue = parseCssValue(getSizeSnapshotValue(draft, axis));

  if (parsedSnapshotValue && parsedSnapshotValue.number > 0) {
    return parsedSnapshotValue.number;
  }

  const memoryValue = getNumericMemoryValue(
    axis,
    mode,
    getSizeModeMemoryState(draft.sizeControl, axis),
    getMeasuredAxisSize(measuredRect, axis)
  );
  const parsedMemoryValue = parseCssValue(memoryValue.trim());

  if (parsedMemoryValue && parsedMemoryValue.number > 0) {
    return parsedMemoryValue.number;
  }

  const measuredSize = getMeasuredAxisSize(measuredRect, axis);
  return measuredSize > 0 ? measuredSize : null;
}

function getLockedAspectRatio(draft: SelectionDraft, measuredRect: DOMRect) {
  const width = getNumericSizeValueFromDraft(draft, 'width', measuredRect);
  const height = getNumericSizeValueFromDraft(draft, 'height', measuredRect);

  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
}

function getSizeModeSnapshot(sizeControl: SizeControlState, axis: SizeAxis) {
  return axis === 'width' ? sizeControl.widthMode : sizeControl.heightMode;
}

function getSizeModeMemoryState(sizeControl: SizeControlState, axis: SizeAxis) {
  return axis === 'width' ? sizeControl.widthMemory : sizeControl.heightMemory;
}

function setSizeModeSnapshot(
  sizeControl: SizeControlState,
  axis: SizeAxis,
  value: SizeControlState['widthMode']
): SizeControlState {
  return axis === 'width'
    ? { ...sizeControl, widthMode: value }
    : { ...sizeControl, heightMode: value };
}

function setSizeMemoryState(
  sizeControl: SizeControlState,
  axis: SizeAxis,
  value: SizeControlState['widthMemory']
): SizeControlState {
  return axis === 'width'
    ? { ...sizeControl, widthMemory: value }
    : { ...sizeControl, heightMemory: value };
}

function getSelectableElementAtPoint(clientX: number, clientY: number) {
  if (typeof document.elementFromPoint !== 'function') {
    return null;
  }

  const target = document.elementFromPoint(clientX, clientY);

  if (!target || isHawkEyeElement(target)) {
    return null;
  }

  const inspectable = target.closest<HTMLElement>(`[${HAWK_EYE_SOURCE_ATTRIBUTE}]`);

  if (!inspectable || isHawkEyeElement(inspectable)) {
    return null;
  }

  return inspectable;
}

function buildSelectionDetails(
  measured: MeasuredElement | null,
  payload: SelectionPayload | null
): SelectionDetails | null {
  if (!measured) {
    return null;
  }

  const parsedPayload =
    payload && payload.source === measured.source
      ? payload
      : (() => {
          const parsedSource = parseSourceToken(measured.source);

          if (!parsedSource) {
            return null;
          }

          return {
            ...parsedSource,
            source: measured.source,
            saveCapability: null,
            saveEnabled: false,
          } satisfies SelectionPayload;
        })();

  if (!parsedPayload) {
    return null;
  }

  return {
    ...parsedPayload,
    source: measured.source,
    analysisFingerprint: '',
    instanceKey: measured.instanceKey,
    saveCapability: null,
    saveEnabled: false,
    styleMode: 'unknown',
    styleAnalysisResolved: false,
    tagName: measured.element.tagName.toLowerCase(),
    classNames: [],
    classAttributeState: 'missing',
    classTargets: [],
    activeClassTargetId: null,
    inlineStyles: {},
    styleAttributeState: 'missing',
  };
}

const DYNAMIC_CLASS_INLINE_FALLBACK_MESSAGE =
  'Dynamic className: edits will be written to inline styles.';
const DYNAMIC_CLASS_STYLE_WRAP_FALLBACK_MESSAGE =
  'Dynamic className + dynamic style: edits will be persisted by wrapping the style prop.';
const DYNAMIC_CLASS_UNSUPPORTED_STYLE_MESSAGE =
  'Dynamic className + unsupported style prop: Update Design cannot persist edits for this element yet.';

function getDynamicClassPersistenceState(draft: SelectionDraft | null) {
  if (!draft || draft.detached || !draft.styleAnalysisResolved) {
    return null;
  }

  if (draft.classAttributeState !== 'dynamic') {
    return null;
  }

  if (draft.styleAttributeState === 'expression') {
    return 'style-wrap-fallback';
  }

  if (draft.styleAttributeState === 'dynamic') {
    return 'unsupported-dynamic-style';
  }

  return 'inline-fallback';
}

function createShadowPortalRoot() {
  const host = document.createElement('div');
  host.setAttribute('data-hawk-eye-ui', 'host');

  const shadowRoot = host.attachShadow({ mode: 'closed' });
  const styleElement = document.createElement('style');
  styleElement.textContent = hawkEyeStyles;

  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('data-hawk-eye-ui', 'portal');

  shadowRoot.append(styleElement, portalRoot);
  document.body.append(host);

  return { host, portalRoot, shadowRoot };
}

function DesignToolRuntime() {
  const [enabled, setEnabled] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SelectionDraft>>({});
  const [hovered, setHovered] = useState<MeasuredElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [previewEditsVisible, setPreviewEditsVisible] = useState(true);
  const [savePending, setSavePending] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [selected, setSelected] = useState<MeasuredElement | null>(null);
  const [selectedInstanceKey, setSelectedInstanceKey] = useState<string | null>(null);
  const [shellState, setShellState] = useState<InspectorShellState>('closed');
  const draftsRef = useRef<Record<string, SelectionDraft>>({});
  const hoverFrameRef = useRef(0);
  const pendingSavePayloadRef = useRef<PendingSavePayload | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const retrySavePayloadRef = useRef<PendingSavePayload | null>(null);
  const retrySaveSourceRef = useRef<string | null>(null);
  const saveRetriedRef = useRef(false);
  const shellTimerRef = useRef<number | null>(null);
  const selectedRef = useRef<MeasuredElement | null>(null);
  const selectedInstanceKeyRef = useRef<string | null>(null);
  const syncMeasurementsFrameRef = useRef(0);
  const previewEditsVisibleRef = useRef(true);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    selectedInstanceKeyRef.current = selectedInstanceKey;
  }, [selectedInstanceKey]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    previewEditsVisibleRef.current = previewEditsVisible;
  }, [previewEditsVisible]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncReducedMotion();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncReducedMotion);
      return () => {
        mediaQuery.removeEventListener('change', syncReducedMotion);
      };
    }

    mediaQuery.addListener(syncReducedMotion);
    return () => {
      mediaQuery.removeListener(syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (shellTimerRef.current) {
        window.clearTimeout(shellTimerRef.current);
      }
    };
  }, []);

  function clearShellTimer() {
    if (!shellTimerRef.current) {
      return;
    }

    window.clearTimeout(shellTimerRef.current);
    shellTimerRef.current = null;
  }

  function settleShellState(nextState: InspectorShellState) {
    clearShellTimer();
    setShellState(nextState);
  }

  function scheduleShellState(settlingState: InspectorShellState) {
    clearShellTimer();
    shellTimerRef.current = window.setTimeout(() => {
      shellTimerRef.current = null;
      setShellState(settlingState);
    }, SHELL_HANDOFF_DURATION_MS);
  }

  function openInspector(intent: ToggleIntent) {
    setEnabled(true);

    if (intent === 'pointer' && !prefersReducedMotion) {
      setShellState('opening');
      scheduleShellState('open');
      return;
    }

    settleShellState('open');
  }

  function closeInspector(intent: ToggleIntent) {
    setEnabled(false);

    if (intent === 'pointer' && !prefersReducedMotion) {
      setShellState('closing');
      scheduleShellState('closed');
      return;
    }

    settleShellState('closed');
  }

  function clearSessionDrafts() {
    for (const draft of Object.values(draftsRef.current)) {
      if (hasDraftChanges(draft)) {
        clearDraftOverrides(draft);
      }
    }

    clearClassTargetPreview();

    setDrafts({});
    setHovered(null);
    setSelected(null);
    setSelectedInstanceKey(null);
  }

  function clearSaveFeedback() {
    setSaveResult(null);
  }

  function syncSelectedDraftPreview(draft: SelectionDraft | null) {
    if (!draft || !previewEditsVisibleRef.current) {
      return;
    }

    renderDraftPreview(draft);
  }

  function rebindSelectedDraftToMeasurement(
    previousInstanceKey: string,
    nextMeasurement: MeasuredElement
  ) {
    const currentDraft = draftsRef.current[previousInstanceKey];

    if (!currentDraft) {
      return;
    }

    if (
      currentDraft.source === nextMeasurement.source &&
      previousInstanceKey === nextMeasurement.instanceKey
    ) {
      return;
    }

    const nextDetails = buildSelectionDetails(nextMeasurement, null);

    if (!nextDetails) {
      return;
    }

    setDrafts((current) => {
      const draft = current[previousInstanceKey];

      if (!draft) {
        return current;
      }

      const nextDraft = {
        ...draft,
        source: nextDetails.source,
        file: nextDetails.file,
        line: nextDetails.line,
        column: nextDetails.column,
        instanceKey: nextMeasurement.instanceKey,
        analysisFingerprint: '',
        styleAnalysisResolved: false,
      };

      if (previousInstanceKey === nextMeasurement.instanceKey) {
        return {
          ...current,
          [previousInstanceKey]: nextDraft,
        };
      }

      const nextDrafts = { ...current };
      delete nextDrafts[previousInstanceKey];
      nextDrafts[nextMeasurement.instanceKey] = nextDraft;
      return nextDrafts;
    });

    setSelectedInstanceKey(nextMeasurement.instanceKey);
    requestSelection({ source: nextMeasurement.source });
  }

  function getCloseBlockedMessage() {
    if (savePending) {
      return 'Wait for Update Design to finish before closing the inspector.';
    }

    if (getDirtyDrafts(draftsRef.current).length > 0) {
      return 'Apply or revert changes before closing the inspector.';
    }

    return null;
  }

  function refreshSelectedMeasurement(instanceKey: string, draftOverride?: SelectionDraft) {
    const nextMeasurement =
      (selectedRef.current?.instanceKey === instanceKey
        ? measureElement(selectedRef.current.element)
        : null) ?? measureElementByKey(instanceKey);

    if (nextMeasurement) {
      rebindSelectedDraftToMeasurement(instanceKey, nextMeasurement);

      const nextDraft = draftOverride ?? draftsRef.current[instanceKey];

      if (nextDraft) {
        syncSelectedDraftPreview(nextDraft);
      }
    }

    setSelected(nextMeasurement);
  }

  function ensureDraftForMeasurement(measured: MeasuredElement) {
    const details = buildSelectionDetails(measured, null);

    if (!details) {
      return null;
    }

    const currentDraft = draftsRef.current[measured.instanceKey];
    const nextDraft = currentDraft
      ? mergeSelectionDraft(currentDraft, details)
      : createSelectionDraft(details, measured.element);

    syncSelectedDraftPreview(nextDraft);
    setDrafts((current) => ({
      ...current,
      [measured.instanceKey]: nextDraft,
    }));

    return nextDraft;
  }

  function resetAllChanges() {
    clearSaveFeedback();
    const currentDrafts = Object.values(draftsRef.current);

    for (const draft of currentDrafts) {
      clearDraftOverrides(draft);
    }

    const lockedInstanceKey = selectedInstanceKey;

    if (!lockedInstanceKey) {
      setDrafts({});
      return;
    }

    const lockedMeasurement = measureElementByKey(lockedInstanceKey);
    const existingDraft = draftsRef.current[lockedInstanceKey];

    if (!lockedMeasurement || !existingDraft) {
      setDrafts({});
      setSelected(null);
      setSelectedInstanceKey(null);
      return;
    }

    const nextDraft = createSelectionDraft(
      {
        ...existingDraft,
        tagName: lockedMeasurement.element.tagName.toLowerCase(),
      },
      lockedMeasurement.element
    );

    setDrafts({
      [lockedInstanceKey]: nextDraft,
    });
    setSelected(lockedMeasurement);
  }

  function updateDraftProperty(propertyId: EditablePropertyId, inputValue: string) {
    if (propertyId === 'width' || propertyId === 'height') {
      updateSizeProperty(propertyId, inputValue);
      return;
    }

    clearSaveFeedback();
    const instanceKey = selectedInstanceKey;

    if (!instanceKey) {
      return;
    }

    const element = getInspectableElementByKey(instanceKey) ?? selected?.element ?? null;

    if (!element) {
      return;
    }

    let nextDraft: SelectionDraft | null = null;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const nextSnapshot = applyDraftInputValue(
        element,
        propertyId,
        currentDraft.properties[propertyId],
        inputValue
      );

      let nextProperties: SelectionDraft['properties'] = {
        ...currentDraft.properties,
        [propertyId]: nextSnapshot,
      };

      if (isBorderWidthPropertyId(propertyId)) {
        const borderColorValue = getSnapshotDisplayValue(currentDraft.properties.borderColor);
        const visibleBorderColor = getVisibleBorderColor(element);

        if (
          visibleBorderColor &&
          (!parseColor(borderColorValue) ||
            !areColorsEquivalent(borderColorValue, visibleBorderColor))
        ) {
          nextProperties = {
            ...nextProperties,
            borderColor: applyDraftInputValue(
              element,
              'borderColor',
              currentDraft.properties.borderColor,
              visibleBorderColor
            ),
          };
        }
      }

      const updatedDraft = {
        ...currentDraft,
        properties: nextProperties,
      };
      nextDraft = updatedDraft;

      return {
        ...current,
        [instanceKey]: updatedDraft,
      };
    });

    if (nextDraft) {
      refreshSelectedMeasurement(instanceKey, nextDraft);
    }
  }

  function updateSizeProperty(axis: SizeAxis, inputValue: string) {
    clearSaveFeedback();
    const instanceKey = selectedInstanceKey;

    if (!instanceKey) {
      return;
    }

    const element = getInspectableElementByKey(instanceKey) ?? selected?.element ?? null;

    if (!element) {
      return;
    }

    const measuredRect = element.getBoundingClientRect();
    let nextDraft: SelectionDraft | null = null;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const parentDisplay = currentDraft.context.parentDisplay;
      if (parentDisplay === 'grid' || parentDisplay === 'inline-grid') {
        return current;
      }

      const propertyId = getAxisPropertyId(axis);
      const axisMode = getSizeModeSnapshot(currentDraft.sizeControl, axis).value;

      if (!isNumericSizeMode(axisMode)) {
        return current;
      }

      const nextSnapshot = applyDraftInputValue(
        element,
        propertyId,
        currentDraft.properties[propertyId],
        inputValue
      );

      let nextSizeControl = currentDraft.sizeControl;

      if (!nextSnapshot.invalid) {
        nextSizeControl = setSizeMemoryState(
          nextSizeControl,
          axis,
          updateSizeModeMemory(
            axis,
            axisMode,
            getSizeModeMemoryState(nextSizeControl, axis),
            nextSnapshot
          )
        );
      }

      const nextProperties = {
        ...currentDraft.properties,
        [propertyId]: nextSnapshot,
      };

      const oppositeAxis = getOppositeAxis(axis);
      const oppositePropertyId = getAxisPropertyId(oppositeAxis);
      const oppositeMode = getSizeModeSnapshot(nextSizeControl, oppositeAxis).value;
      const parsedNextValue = parseCssValue(nextSnapshot.value.trim());
      const lockedAspectRatio =
        nextSizeControl.aspectRatio ?? getLockedAspectRatio(currentDraft, measuredRect);

      if (
        nextSizeControl.aspectRatioLocked &&
        !nextSnapshot.invalid &&
        parsedNextValue &&
        lockedAspectRatio &&
        lockedAspectRatio > 0 &&
        isNumericSizeMode(oppositeMode)
      ) {
        const oppositeSnapshot = currentDraft.properties[oppositePropertyId];
        const oppositeMemory = getSizeModeMemoryState(nextSizeControl, oppositeAxis);
        const oppositeSeedValue = getNumericMemoryValue(
          oppositeAxis,
          oppositeMode,
          oppositeMemory,
          getMeasuredAxisSize(measuredRect, oppositeAxis)
        );
        const oppositeUnit =
          parseCssValue((oppositeSnapshot.inputValue || oppositeSnapshot.value).trim())?.unit ||
          parseCssValue(oppositeSeedValue)?.unit ||
          getSizeUnitsForMode(oppositeAxis, oppositeMode)[0] ||
          'px';
        const coupledNumber =
          axis === 'width'
            ? parsedNextValue.number / lockedAspectRatio
            : parsedNextValue.number * lockedAspectRatio;
        const coupledValue = formatSizeValue(coupledNumber, oppositeUnit);
        const nextOppositeSnapshot = applyDraftInputValue(
          element,
          oppositePropertyId,
          oppositeSnapshot,
          coupledValue
        );

        nextProperties[oppositePropertyId] = nextOppositeSnapshot;

        if (!nextOppositeSnapshot.invalid) {
          nextSizeControl = setSizeMemoryState(
            nextSizeControl,
            oppositeAxis,
            updateSizeModeMemory(
              oppositeAxis,
              oppositeMode,
              getSizeModeMemoryState(nextSizeControl, oppositeAxis),
              nextOppositeSnapshot
            )
          );
        }
      }

      const updatedDraft = {
        ...currentDraft,
        properties: nextProperties,
        sizeControl: nextSizeControl,
      };
      syncSelectedDraftPreview(updatedDraft);
      nextDraft = updatedDraft;

      return {
        ...current,
        [instanceKey]: updatedDraft,
      };
    });

    if (nextDraft) {
      refreshSelectedMeasurement(instanceKey, nextDraft);
    }
  }

  function updateSizeMode(axis: SizeAxis, mode: SizeMode) {
    clearSaveFeedback();
    const instanceKey = selectedInstanceKey;

    if (!instanceKey) {
      return;
    }

    const element = getInspectableElementByKey(instanceKey) ?? selected?.element ?? null;

    if (!element) {
      return;
    }

    const measuredRect = element.getBoundingClientRect();
    let nextDraft: SelectionDraft | null = null;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const parentDisplayFromDraft = currentDraft.context.parentDisplay;
      if (parentDisplayFromDraft === 'grid' || parentDisplayFromDraft === 'inline-grid') {
        return current;
      }

      const propertyId = getAxisPropertyId(axis);
      const currentModeSnapshot = getSizeModeSnapshot(currentDraft.sizeControl, axis);
      let nextSizeControl = currentDraft.sizeControl;

      if (isNumericSizeMode(currentModeSnapshot.value)) {
        nextSizeControl = setSizeMemoryState(
          nextSizeControl,
          axis,
          updateSizeModeMemory(
            axis,
            currentModeSnapshot.value,
            getSizeModeMemoryState(nextSizeControl, axis),
            currentDraft.properties[propertyId]
          )
        );
      }

      // Detect parent layout context for smart "fill" behavior
      const parentDisplay = element.parentElement
        ? window.getComputedStyle(element.parentElement).display
        : 'block';
      const parentIsFlex = parentDisplay === 'flex' || parentDisplay === 'inline-flex';
      const parentIsGrid = parentDisplay === 'grid' || parentDisplay === 'inline-grid';

      // Determine if this axis is the main axis of the parent flex container
      const parentFlexDirection =
        parentIsFlex && element.parentElement
          ? window.getComputedStyle(element.parentElement).flexDirection
          : '';
      const isMainAxis =
        (parentFlexDirection === 'row' && axis === 'width') ||
        (parentFlexDirection === 'column' && axis === 'height') ||
        (parentFlexDirection === 'row-reverse' && axis === 'width') ||
        (parentFlexDirection === 'column-reverse' && axis === 'height');
      const isCrossAxis = parentIsFlex && !isMainAxis;

      let nextValue: string;
      let extraProperties: Record<string, string> = {};

      if (mode === 'hug') {
        nextValue = 'fit-content';
        // When switching to hug, reset flex child properties
        if (parentIsFlex) {
          extraProperties = { flexGrow: '0', flexShrink: '1', flexBasis: 'auto' };
          if (isCrossAxis) extraProperties.alignSelf = 'auto';
        }
      } else if (mode === 'fill') {
        if (parentIsFlex && isMainAxis) {
          // Main-axis fill: use flex-grow instead of width/height: 100%
          nextValue = 'auto';
          extraProperties = { flexGrow: '1', flexBasis: '0px' };
        } else if (parentIsFlex && isCrossAxis) {
          // Cross-axis fill: use align-self: stretch
          nextValue = 'auto';
          extraProperties = { alignSelf: 'stretch' };
        } else if (parentIsGrid) {
          // Grid children stretch by default; auto is sufficient
          nextValue = 'auto';
        } else {
          nextValue = '100%';
        }
      } else {
        nextValue = getNumericMemoryValue(
          axis,
          mode,
          getSizeModeMemoryState(nextSizeControl, axis),
          getMeasuredAxisSize(measuredRect, axis)
        );
        // When switching to fixed, reset flex child overrides
        if (parentIsFlex) {
          extraProperties = { flexGrow: '0', flexBasis: 'auto' };
          if (isCrossAxis) extraProperties.alignSelf = 'auto';
        }
      }

      const nextSnapshot = applyDraftInputValue(
        element,
        propertyId,
        currentDraft.properties[propertyId],
        nextValue
      );

      // Apply extra flex/grid child properties
      let nextProperties = {
        ...currentDraft.properties,
        [propertyId]: nextSnapshot,
      };
      for (const [extraId, extraValue] of Object.entries(extraProperties)) {
        const extraPropId = extraId as EditablePropertyId;
        if (currentDraft.properties[extraPropId]) {
          const extraSnapshot = applyDraftInputValue(
            element,
            extraPropId,
            currentDraft.properties[extraPropId],
            extraValue
          );
          nextProperties = { ...nextProperties, [extraPropId]: extraSnapshot };
        }
      }

      nextSizeControl = setSizeModeSnapshot(nextSizeControl, axis, {
        ...currentModeSnapshot,
        value: mode,
      });

      if (isNumericSizeMode(mode) && !nextSnapshot.invalid) {
        nextSizeControl = setSizeMemoryState(
          nextSizeControl,
          axis,
          updateSizeModeMemory(
            axis,
            mode,
            getSizeModeMemoryState(nextSizeControl, axis),
            nextSnapshot
          )
        );
      }

      const updatedDraft = {
        ...currentDraft,
        properties: nextProperties,
        sizeControl: nextSizeControl,
      };
      syncSelectedDraftPreview(updatedDraft);
      nextDraft = updatedDraft;

      return {
        ...current,
        [instanceKey]: updatedDraft,
      };
    });

    if (nextDraft) {
      refreshSelectedMeasurement(instanceKey, nextDraft);
    }
  }

  function toggleAspectRatioLock() {
    clearSaveFeedback();
    const instanceKey = selectedInstanceKey;

    if (!instanceKey) {
      return;
    }

    const element = getInspectableElementByKey(instanceKey) ?? selected?.element ?? null;

    if (!element) {
      return;
    }

    const measuredRect = element.getBoundingClientRect();

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const nextLocked = !currentDraft.sizeControl.aspectRatioLocked;

      return {
        ...current,
        [instanceKey]: {
          ...currentDraft,
          sizeControl: {
            ...currentDraft.sizeControl,
            aspectRatio: nextLocked ? getLockedAspectRatio(currentDraft, measuredRect) : null,
            aspectRatioLocked: nextLocked,
          },
        },
      };
    });
  }

  function detachSelectedDraft() {
    clearSaveFeedback();
    const instanceKey = selectedInstanceKey;

    if (!instanceKey) {
      return;
    }

    const element = getInspectableElementByKey(instanceKey) ?? selected?.element ?? null;

    if (!element) {
      return;
    }

    let nextDraft: SelectionDraft | null = null;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const updatedDraft = detachDraft(currentDraft, element);
      nextDraft = updatedDraft;

      return {
        ...current,
        [instanceKey]: updatedDraft,
      };
    });

    if (nextDraft) {
      refreshSelectedMeasurement(instanceKey, nextDraft);
    }
  }

  function changeClassTarget(targetId: string) {
    clearSaveFeedback();
    const instanceKey = selectedInstanceKey;

    if (!instanceKey) {
      return;
    }

    let nextDraft: SelectionDraft | null = null;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft || currentDraft.detached) {
        return current;
      }

      if (!currentDraft.classTargets.some((target) => target.id === targetId)) {
        return current;
      }

      const updatedDraft = {
        ...currentDraft,
        activeClassTargetId: targetId,
      };
      nextDraft = updatedDraft;

      return {
        ...current,
        [instanceKey]: updatedDraft,
      };
    });

    if (nextDraft) {
      syncSelectedDraftPreview(nextDraft);
    }
  }

  function resetProperty(instanceKey: string, propertyId: EditablePropertyId) {
    clearSaveFeedback();
    const element = getInspectableElementByKey(instanceKey);
    let nextDraft: SelectionDraft | null = null;
    let removedDraft = false;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const nextSnapshot = resetDraftProperty(element, currentDraft, propertyId);
      let nextSizeControl = currentDraft.sizeControl;

      if (propertyId === 'width' || propertyId === 'height') {
        const nextSizeMode = resetDraftSizeMode(element, currentDraft, propertyId);
        nextSizeControl = setSizeModeSnapshot(nextSizeControl, propertyId, nextSizeMode);
      }

      const updatedDraft = {
        ...currentDraft,
        properties: {
          ...currentDraft.properties,
          [propertyId]: nextSnapshot,
        },
        sizeControl: nextSizeControl,
      };
      nextDraft = updatedDraft;

      if (instanceKey !== selectedInstanceKey && !hasDraftChanges(updatedDraft)) {
        const nextDrafts = { ...current };
        delete nextDrafts[instanceKey];
        removedDraft = true;
        return nextDrafts;
      }

      return {
        ...current,
        [instanceKey]: updatedDraft,
      };
    });

    if (instanceKey === selectedInstanceKey && nextDraft) {
      refreshSelectedMeasurement(instanceKey, nextDraft);
    } else if (removedDraft) {
      refreshSelectedMeasurement(instanceKey);
    }
  }

  function applyPendingDrafts() {
    if (!enabled || savePending || saveBlockedReason) {
      return;
    }

    const payload = buildSavePayload(getDirtyDrafts(draftsRef.current));

    if (!payload.capability || payload.mutations.length === 0) {
      return;
    }

    retrySavePayloadRef.current = null;
    retrySaveSourceRef.current = null;
    saveRetriedRef.current = false;
    pendingSavePayloadRef.current = payload;
    setSavePending(true);
    setSaveResult(null);
    requestSave(payload);
  }

  useEffect(() => {
    const unsubscribeSelection = subscribeToSelection((payload) => {
      startTransition(() => {
        setDrafts((current) => {
          let changed = false;
          const nextEntries = Object.entries(current).map(([instanceKey, draft]) => {
            if (draft.source !== payload.source) {
              return [instanceKey, draft] as const;
            }

            changed = true;

            return [
              instanceKey,
              mergeSelectionDraft(draft, {
                ...payload,
                instanceKey: draft.instanceKey,
                analysisFingerprint: '',
                styleMode: draft.styleMode,
                styleAnalysisResolved: false,
                tagName: draft.tagName,
                classNames: draft.classNames,
                classAttributeState: draft.classAttributeState,
                classTargets: draft.classTargets,
                activeClassTargetId: draft.activeClassTargetId,
                inlineStyles: draft.inlineStyles,
                styleAttributeState: draft.styleAttributeState,
              }),
            ] as const;
          });

          if (!changed) {
            return current;
          }

          return Object.fromEntries(nextEntries);
        });
      });
    });

    const unsubscribeStyleAnalysis = subscribeToStyleAnalysis((payload: StyleAnalysisPayload) => {
      startTransition(() => {
        setDrafts((current) => {
          let changed = false;
          const nextEntries = Object.entries(current).map(([instanceKey, draft]) => {
            if (draft.source !== payload.source) {
              return [instanceKey, draft] as const;
            }

            if (draft.detached) {
              return [instanceKey, draft] as const;
            }

            changed = true;

            return [
              instanceKey,
              {
                ...draft,
                analysisFingerprint: payload.fingerprint,
                detached: draft.detached,
                styleMode: payload.mode,
                styleAnalysisResolved: true,
                classNames: payload.classNames,
                classAttributeState: payload.classAttributeState,
                classTargets: draft.detached ? draft.classTargets : payload.classTargets,
                activeClassTargetId: draft.detached
                  ? draft.activeClassTargetId
                  : draft.activeClassTargetId &&
                      payload.classTargets.some((target) => target.id === draft.activeClassTargetId)
                    ? draft.activeClassTargetId
                    : payload.classTargets[0]?.id ?? null,
                inlineStyles: payload.inlineStyles,
                saveCapability: payload.saveCapability,
                saveEnabled: payload.saveEnabled,
                styleAttributeState: payload.styleAttributeState,
              },
            ] as const;
          });

          if (!changed) {
            return current;
          }

          return Object.fromEntries(nextEntries);
        });

        if (
          retrySavePayloadRef.current &&
          retrySaveSourceRef.current === payload.source &&
          payload.saveCapability
        ) {
          const retryPayload = {
            ...retrySavePayloadRef.current,
            capability: payload.saveCapability,
          };

          retrySavePayloadRef.current = null;
          retrySaveSourceRef.current = null;
          pendingSavePayloadRef.current = retryPayload;
          requestSave(retryPayload);
        }
      });
    });

    const unsubscribeSaveResult = subscribeToSaveResult((payload: SaveResult) => {
      startTransition(() => {
        const pendingPayload = pendingSavePayloadRef.current;

        if (pendingPayload && !saveRetriedRef.current && hasInvalidCapabilityWarning(payload)) {
          const recoverySource =
            collectMutationSources(draftsRef.current, pendingPayload)[0] ?? null;

          if (recoverySource) {
            saveRetriedRef.current = true;
            retrySavePayloadRef.current = pendingPayload;
            retrySaveSourceRef.current = recoverySource;
            pendingSavePayloadRef.current = null;
            setSavePending(true);
            setSaveResult(null);
            requestStyleAnalysis({ source: recoverySource });
            return;
          }
        }

        pendingSavePayloadRef.current = null;
        retrySavePayloadRef.current = null;
        retrySaveSourceRef.current = null;
        saveRetriedRef.current = false;
        setSavePending(false);
        setSaveResult(payload);

        if (payload.success && pendingPayload) {
          const sources = collectMutationSources(draftsRef.current, pendingPayload);

          setDrafts((current) => commitPersistedDrafts(current, pendingPayload));

          for (const source of sources) {
            requestStyleAnalysis({ source });
          }
        }
      });
    });

    return () => {
      unsubscribeSelection();
      unsubscribeStyleAnalysis();
      unsubscribeSaveResult();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !selected?.source) {
      return;
    }

    setDrafts((current) => {
      const instanceKey = selectedInstanceKeyRef.current;

      if (!instanceKey || !current[instanceKey]) {
        return current;
      }

      return {
        ...current,
        [instanceKey]: {
          ...current[instanceKey],
          analysisFingerprint: '',
          styleAnalysisResolved: false,
        },
      };
    });
    requestStyleAnalysis({ source: selected.source });
  }, [enabled, selected?.source]);

  useEffect(() => {
    if (!enabled) {
      clearSessionDrafts();
      pendingSavePayloadRef.current = null;
      retrySavePayloadRef.current = null;
      retrySaveSourceRef.current = null;
      saveRetriedRef.current = false;
      setSavePending(false);
      setSaveResult(null);
      return;
    }

    const syncMeasurements = () => {
      syncMeasurementsFrameRef.current = 0;
      setHovered((current) => (current ? measureElementByKey(current.instanceKey) : null));

      const lockedInstanceKey = selectedInstanceKeyRef.current;

      if (lockedInstanceKey) {
        refreshSelectedMeasurement(lockedInstanceKey);
      }
    };

    const scheduleMeasurementSync = () => {
      if (syncMeasurementsFrameRef.current) {
        return;
      }

      syncMeasurementsFrameRef.current = window.requestAnimationFrame(syncMeasurements);
    };

    const handlePointerMove = (event: MouseEvent) => {
      if (selectedInstanceKeyRef.current) {
        return;
      }

      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (hoverFrameRef.current) {
        return;
      }

      hoverFrameRef.current = window.requestAnimationFrame(() => {
        hoverFrameRef.current = 0;
        const nextPointer = pointerRef.current;

        if (!nextPointer) {
          return;
        }

        const nextElement = getSelectableElementAtPoint(nextPointer.x, nextPointer.y);
        const nextMeasurement = measureElement(nextElement);

        setHovered((current) =>
          sameMeasuredElement(current, nextMeasurement) ? current : nextMeasurement
        );
      });
    };

    const handleClick = (event: MouseEvent) => {
      if (!isTestRuntime() && !event.isTrusted) return;

      if (
        event
          .composedPath()
          .some(
            (target): target is Element => target instanceof Element && isHawkEyeElement(target)
          )
      ) {
        return;
      }

      const nextElement = getSelectableElementAtPoint(event.clientX, event.clientY);

      if (!nextElement) {
        return;
      }

      const nextMeasurement = measureElement(nextElement);

      if (!nextMeasurement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      clearSaveFeedback();
      ensureDraftForMeasurement(nextMeasurement);
      setSelectedInstanceKey(nextMeasurement.instanceKey);
      setSelected(nextMeasurement);
      requestSelection({ source: nextMeasurement.source });
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      const closeBlockedMessage = getCloseBlockedMessage();

      if (closeBlockedMessage) {
        setSaveResult({
          success: false,
          error: closeBlockedMessage,
          warnings: [],
        });
        return;
      }

      closeInspector('escape');
    };

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', scheduleMeasurementSync);
    window.addEventListener('scroll', scheduleMeasurementSync, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', scheduleMeasurementSync);
      window.removeEventListener('scroll', scheduleMeasurementSync, true);

      if (hoverFrameRef.current) {
        window.cancelAnimationFrame(hoverFrameRef.current);
        hoverFrameRef.current = 0;
      }

      if (syncMeasurementsFrameRef.current) {
        window.cancelAnimationFrame(syncMeasurementsFrameRef.current);
        syncMeasurementsFrameRef.current = 0;
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (
      !enabled ||
      !selectedInstanceKey ||
      !selected?.element ||
      typeof window.MutationObserver === 'undefined'
    ) {
      return;
    }

    const observedRoot = selected.element.parentElement ?? selected.element;
    let frame = 0;

    const syncSelectionSource = () => {
      frame = 0;
      const lockedInstanceKey = selectedInstanceKeyRef.current;

      if (!lockedInstanceKey) {
        return;
      }

      refreshSelectedMeasurement(lockedInstanceKey);
    };

    const observer = new window.MutationObserver(() => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(syncSelectionSource);
    });

    observer.observe(observedRoot, {
      attributes: true,
      attributeFilter: [HAWK_EYE_SOURCE_ATTRIBUTE],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [enabled, selected?.element, selectedInstanceKey]);

  useEffect(() => {
    const activeDrafts = Object.values(drafts).filter(hasDraftChanges);

    if (!enabled || activeDrafts.length === 0 || typeof window.MutationObserver === 'undefined') {
      return;
    }

    let frame = 0;

    const syncDrafts = () => {
      frame = 0;

      for (const draft of Object.values(draftsRef.current)) {
        const element = getInspectableElementByKey(draft.instanceKey);

        if (element) {
          applyDraftToElement(element, draft);
        }
      }

      const lockedInstanceKey = selectedInstanceKeyRef.current;

      if (lockedInstanceKey) {
        const nextMeasurement = measureElementByKey(lockedInstanceKey);
        setSelected(nextMeasurement);
      }
    };

    const observer = new window.MutationObserver(() => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(syncDrafts);
    });

    const observedRoots = new Set<HTMLElement>();

    for (const draft of activeDrafts) {
      const element = getInspectableElementByKey(draft.instanceKey);
      const observedRoot = element?.parentElement ?? null;

      if (observedRoot) {
        observedRoots.add(observedRoot);
      }
    }

    if (observedRoots.size === 0) {
      return;
    }

    for (const observedRoot of observedRoots) {
      observer.observe(observedRoot, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [drafts, enabled]);

  const selectedDraft = selectedInstanceKey ? (drafts[selectedInstanceKey] ?? null) : null;
  const pendingDrafts = getDirtyDrafts(drafts).sort((left, right) => {
    if (left.instanceKey === selectedInstanceKey) {
      return -1;
    }

    if (right.instanceKey === selectedInstanceKey) {
      return 1;
    }

    return (
      left.source.localeCompare(right.source) || left.instanceKey.localeCompare(right.instanceKey)
    );
  });
  const hasPendingDrafts = pendingDrafts.length > 0;
  const hasPendingStyleAnalysis = pendingDrafts.some((draft) => !draft.styleAnalysisResolved);
  const saveEnabled = pendingDrafts.every(
    (draft) => draft.saveEnabled && Boolean(draft.saveCapability)
  );
  const selectedDynamicClassPersistenceState = getDynamicClassPersistenceState(selectedDraft);
  const hasUnsupportedDynamicStyleDraft = pendingDrafts.some(
    (draft) => getDynamicClassPersistenceState(draft) === 'unsupported-dynamic-style'
  );

  useEffect(() => {
    if (!enabled || !previewEditsVisible) {
      return;
    }

    syncSelectedDraftPreview(selectedDraft);
  }, [enabled, previewEditsVisible, selectedDraft]);

  useEffect(() => {
    if (!enabled || !previewEditsVisible) {
      clearClassTargetPreview();
      return;
    }

    // Global class-target preview: driven by all dirty class-target drafts,
    // not by the currently selected element.
    renderAllClassTargetPreview(pendingDrafts);
  }, [enabled, previewEditsVisible, pendingDrafts]);

  let saveBlockedReason: string | null = null;
  let saveBlockedState: 'error' | 'pending' = 'pending';

  if (hasPendingStyleAnalysis) {
    saveBlockedReason =
      'Finishing style analysis before Update Design can apply the latest source changes.';
    saveBlockedState = 'pending';
  } else if (!saveEnabled) {
    saveBlockedReason =
      'Direct source writes are disabled. Enable `enableSave` in `hawkeyePlugin()` to use Update Design.';
    saveBlockedState = 'pending';
  } else if (hasUnsupportedDynamicStyleDraft) {
    saveBlockedReason = DYNAMIC_CLASS_UNSUPPORTED_STYLE_MESSAGE;
    saveBlockedState = 'error';
  }

  let saveInfoMessage: string | null = null;
  let saveInfoState: 'error' | 'info' = 'info';

  if (!saveBlockedReason) {
    if (selectedDynamicClassPersistenceState === 'inline-fallback') {
      saveInfoMessage = DYNAMIC_CLASS_INLINE_FALLBACK_MESSAGE;
      saveInfoState = 'info';
    } else if (selectedDynamicClassPersistenceState === 'style-wrap-fallback') {
      saveInfoMessage = DYNAMIC_CLASS_STYLE_WRAP_FALLBACK_MESSAGE;
      saveInfoState = 'info';
    }
  }

  useEffect(() => {
    if (!hasPendingDrafts && !savePending) {
      return;
    }

    function handleBeforeUnload(event: { preventDefault(): void; returnValue: string }) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingDrafts, savePending]);

  function attemptToggleInspector(intent: ToggleIntent = 'pointer') {
    if (!enabled) {
      openInspector(intent);
      return;
    }

    const closeBlockedMessage = getCloseBlockedMessage();

    if (closeBlockedMessage) {
      setSaveResult({
        success: false,
        error: closeBlockedMessage,
        warnings: [],
      });
      return;
    }

    closeInspector(intent);
  }

  function handleTogglePreviewEdits(visible: boolean) {
    setPreviewEditsVisible(visible);
    previewEditsVisibleRef.current = visible;

    for (const draft of pendingDrafts) {
      if (visible) {
        const element = getInspectableElementByKey(draft.instanceKey);
        if (element) applyDraftToElement(element, draft);
      } else {
        clearDraftOverrides(draft);
      }
    }

    if (!visible) {
      clearClassTargetPreview();
    } else if (selectedDraft) {
      syncSelectedDraftPreview(selectedDraft);
    }
  }

  const motionTimings: InspectorMotionTimings = {
    shell: prefersReducedMotion ? 0 : SHELL_HANDOFF_DURATION_MS,
    status: prefersReducedMotion ? 0 : STATUS_TRANSITION_DURATION_MS,
    view: prefersReducedMotion ? 0 : VIEW_TRANSITION_DURATION_MS,
  };

  function selectByKey(instanceKey: string) {
    const element = getInspectableElementByKey(instanceKey);
    const measured = measureElement(element);

    if (!measured) {
      return;
    }

    clearSaveFeedback();
    ensureDraftForMeasurement(measured);
    setSelectedInstanceKey(measured.instanceKey);
    setSelected(measured);
    requestSelection({ source: measured.source });
  }

  return (
    <Inspector
      enabled={enabled}
      hovered={hovered}
      motionTimings={motionTimings}
      onChange={updateDraftProperty}
      onChangeClassTarget={changeClassTarget}
      onChangeSizeMode={updateSizeMode}
      onChangeSizeValue={updateSizeProperty}
      onDetach={detachSelectedDraft}
      onResetAll={resetAllChanges}
      onResetProperty={resetProperty}
      onSave={applyPendingDrafts}
      onSelectByKey={selectByKey}
      onToggleAspectRatioLock={toggleAspectRatioLock}
      onToggle={attemptToggleInspector}
      onTogglePreviewEdits={handleTogglePreviewEdits}
      pendingDrafts={pendingDrafts}
      prefersReducedMotion={prefersReducedMotion}
      saveBlockedReason={saveBlockedReason}
      saveBlockedState={saveBlockedState}
      saveInfoMessage={saveInfoMessage}
      saveInfoState={saveInfoState}
      savePending={savePending}
      saveResult={saveResult}
      shellState={shellState}
      selected={selected}
      selectedDraft={selectedDraft}
      selectedInstanceKey={selectedInstanceKey}
    />
  );
}

export function DesignTool(_props: DesignToolProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const { host, portalRoot: nextPortalRoot, shadowRoot } = createShadowPortalRoot();
    (host as unknown as Record<string, unknown>).__hawkEyeShadowRoot = shadowRoot;
    setPortalRoot(nextPortalRoot);

    return () => {
      setPortalRoot(null);
      host.remove();
    };
  }, []);

  if (!portalRoot) {
    return null;
  }

  return createPortal(<DesignToolRuntime />, portalRoot);
}
