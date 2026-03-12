import React, { startTransition, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  applyDraftInputValue,
  applyDraftToElement,
  clearDraftOverrides,
  createInspectableElementKey,
  createSelectionDraft,
  getDirtyDrafts,
  getInspectableElementByKey,
  hasDraftChanges,
  mergeSelectionDraft,
  resetDraftProperty,
} from './drafts';
import { Inspector } from './Inspector';
import { hawkEyeStyles } from './styles';
import type {
  EditablePropertyId,
  MeasuredElement,
  SelectionDetails,
  SelectionDraft,
  SelectionPayload,
  StyleAnalysisPayload,
} from './types';
import {
  requestSelection,
  requestStyleAnalysis,
  subscribeToSelection,
  subscribeToStyleAnalysis,
} from './ws-client';

export interface DesignToolProps {
  // Phase 2 keeps the public API zero-config.
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

  function resetProperty(instanceKey: string, propertyId: EditablePropertyId) {
    const element = getInspectableElementByKey(instanceKey);
    let nextDraft: SelectionDraft | null = null;
    let removedDraft = false;

    setDrafts((current) => {
      const currentDraft = current[instanceKey];

      if (!currentDraft) {
        return current;
      }

      const nextSnapshot = resetDraftProperty(element, currentDraft, propertyId);
      const updatedDraft = {
        ...currentDraft,
        properties: {
          ...currentDraft.properties,
          [propertyId]: nextSnapshot,
        },
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

            changed = true;

            return [
              instanceKey,
              {
                ...draft,
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

    return () => {
      unsubscribeSelection();
      unsubscribeStyleAnalysis();
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

  return (
    <Inspector
      enabled={enabled}
      hovered={hovered}
      onChange={updateDraftProperty}
      onResetAll={resetAllChanges}
      onResetProperty={resetProperty}
      onToggle={() => setEnabled((current) => !current)}
      pendingDrafts={pendingDrafts}
      selected={selected}
      selectedDraft={selectedDraft}
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
