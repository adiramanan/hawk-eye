import React, { startTransition, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOCUSED_PROPERTY_IDS, editablePropertyDefinitionMap } from './editable-properties';
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
import { Inspector } from './Inspector';
import {
  formatSizeValue,
  getNumericMemoryValue,
  getSizeUnitsForMode,
  isNumericSizeMode,
  updateSizeModeMemory,
} from './size-state';
import { hawkEyeStyles } from './styles';
import type {
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

function buildSavePayload(drafts: SelectionDraft[]): SavePayload {
  const mutations: SavePayload['mutations'] = [];

  for (const draft of drafts) {
    const propertyIds = draft.detached
      ? Array.from(FOCUSED_PROPERTY_IDS)
      : getDirtyPropertyIds(draft);
    const sizeModeMetadata = getDirtySizeModes(draft);
    const properties = propertyIds.map((propertyId) => ({
      propertyId,
      cssProperty: editablePropertyDefinitionMap[propertyId].cssProperty,
      oldValue: draft.properties[propertyId].baseline,
      newValue: draft.properties[propertyId].value,
    }));

    if (properties.length === 0 && !sizeModeMetadata.width && !sizeModeMetadata.height) {
      continue;
    }

    mutations.push({
      file: draft.file,
      line: draft.line,
      column: draft.column,
      styleMode: draft.styleMode,
      detached: draft.detached,
      properties,
      ...(sizeModeMetadata.width || sizeModeMetadata.height
        ? { sizeModeMetadata }
        : {}),
    });
  }

  return { mutations };
}

function parseSourceToken(source: string): SelectionPayload | null {
  const match = /^(.*):(\d+):(\d+)$/.exec(source);

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
    source: `${file}:${line}:${column}`,
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

  const source = element.dataset.source;

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

  const inspectable = target.closest<HTMLElement>('[data-source]');

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
    payload && payload.source === measured.source ? payload : parseSourceToken(measured.source);

  if (!parsedPayload) {
    return null;
  }

  return {
    ...parsedPayload,
    instanceKey: measured.instanceKey,
    styleMode: 'unknown',
    tagName: measured.element.tagName.toLowerCase(),
    classNames: [],
    inlineStyles: {},
  };
}

function createShadowPortalRoot() {
  const host = document.createElement('div');
  host.setAttribute('data-hawk-eye-ui', 'host');

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const styleElement = document.createElement('style');
  styleElement.textContent = hawkEyeStyles;

  const portalRoot = document.createElement('div');
  portalRoot.setAttribute('data-hawk-eye-ui', 'portal');

  shadowRoot.append(styleElement, portalRoot);
  document.body.append(host);

  return { host, portalRoot };
}

function DesignToolRuntime() {
  const [enabled, setEnabled] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, SelectionDraft>>({});
  const [hovered, setHovered] = useState<MeasuredElement | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [selected, setSelected] = useState<MeasuredElement | null>(null);
  const [selectedInstanceKey, setSelectedInstanceKey] = useState<string | null>(null);
  const draftsRef = useRef<Record<string, SelectionDraft>>({});
  const selectedInstanceKeyRef = useRef<string | null>(null);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    selectedInstanceKeyRef.current = selectedInstanceKey;
  }, [selectedInstanceKey]);

  function clearSessionDrafts() {
    for (const draft of Object.values(draftsRef.current)) {
      clearDraftOverrides(draft);
    }

    setDrafts({});
    setHovered(null);
    setSelected(null);
    setSelectedInstanceKey(null);
  }

  function clearSaveFeedback() {
    setSaveResult(null);
  }

  function refreshSelectedMeasurement(instanceKey: string, draftOverride?: SelectionDraft) {
    const nextMeasurement = measureElementByKey(instanceKey);

    if (nextMeasurement) {
      const nextDraft = draftOverride ?? draftsRef.current[instanceKey];

      if (nextDraft) {
        applyDraftToElement(nextMeasurement.element, nextDraft);
      }
    }

    setSelected(nextMeasurement);
  }

  function ensureDraftForMeasurement(measured: MeasuredElement) {
    const details = buildSelectionDetails(measured, parseSourceToken(measured.source));

    if (!details) {
      return null;
    }

    const currentDraft = draftsRef.current[measured.instanceKey];
    const nextDraft = currentDraft
      ? mergeSelectionDraft(currentDraft, details)
      : createSelectionDraft(details, measured.element);

    applyDraftToElement(measured.element, nextDraft);
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

      const updatedDraft = {
        ...currentDraft,
        properties: {
          ...currentDraft.properties,
          [propertyId]: nextSnapshot,
        },
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
      const parentFlexDirection = parentIsFlex && element.parentElement
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
                styleMode: draft.styleMode,
                tagName: draft.tagName,
                classNames: draft.classNames,
                inlineStyles: draft.inlineStyles,
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
                detached: draft.detached,
                styleMode: payload.mode,
                classNames: payload.classNames,
                inlineStyles: payload.inlineStyles,
              },
            ] as const;
          });

          if (!changed) {
            return current;
          }

          return Object.fromEntries(nextEntries);
        });
      });
    });

    const unsubscribeSaveResult = subscribeToSaveResult((payload: SaveResult) => {
      startTransition(() => {
        setSavePending(false);
        setSaveResult(payload);

        if (payload.success) {
          clearSessionDrafts();
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

    requestStyleAnalysis({ source: selected.source });
  }, [enabled, selected?.source]);

  useEffect(() => {
    if (!enabled) {
      clearSessionDrafts();
      setSavePending(false);
      setSaveResult(null);
      return;
    }

    const syncMeasurements = () => {
      setHovered((current) => (current ? measureElementByKey(current.instanceKey) : null));

      const lockedInstanceKey = selectedInstanceKeyRef.current;

      if (lockedInstanceKey) {
        refreshSelectedMeasurement(lockedInstanceKey);
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      if (selectedInstanceKeyRef.current) {
        return;
      }

      const nextElement = getSelectableElementAtPoint(event.clientX, event.clientY);
      const nextMeasurement = measureElement(nextElement);

      setHovered((current) =>
        sameMeasuredElement(current, nextMeasurement) ? current : nextMeasurement
      );
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.composedPath().some(
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
      setEnabled(false);
    };

    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', syncMeasurements);
    window.addEventListener('scroll', syncMeasurements, true);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', syncMeasurements);
      window.removeEventListener('scroll', syncMeasurements, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window.MutationObserver === 'undefined') {
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

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [enabled]);

  const selectedDraft = selectedInstanceKey ? (drafts[selectedInstanceKey] ?? null) : null;
  const pendingDrafts = getDirtyDrafts(drafts).sort((left, right) => {
    if (left.instanceKey === selectedInstanceKey) {
      return -1;
    }

    if (right.instanceKey === selectedInstanceKey) {
      return 1;
    }

    return left.source.localeCompare(right.source) || left.instanceKey.localeCompare(right.instanceKey);
  });
  const hasPendingDrafts = pendingDrafts.length > 0;

  useEffect(() => {
    if (!hasPendingDrafts) {
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
  }, [hasPendingDrafts]);

  function savePendingDrafts() {
    if (savePending) {
      return;
    }

    const payload = buildSavePayload(getDirtyDrafts(draftsRef.current));

    if (payload.mutations.length === 0) {
      return;
    }

    setSavePending(true);
    setSaveResult(null);
    requestSave(payload);
  }

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
      onChange={updateDraftProperty}
      onChangeSizeMode={updateSizeMode}
      onChangeSizeValue={updateSizeProperty}
      onDetach={detachSelectedDraft}
      onResetAll={resetAllChanges}
      onResetProperty={resetProperty}
      onSave={savePendingDrafts}
      onSelectByKey={selectByKey}
      onToggleAspectRatioLock={toggleAspectRatioLock}
      onToggle={() => setEnabled((current) => !current)}
      pendingDrafts={pendingDrafts}
      savePending={savePending}
      saveResult={saveResult}
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

    const { host, portalRoot: nextPortalRoot } = createShadowPortalRoot();
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
