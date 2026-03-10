import React, { startTransition, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  applyDraftInputValue,
  applyDraftToElement,
  clearDraftOverrides,
  createSelectionDraft,
  getDirtyDrafts,
  getInspectableElementBySource,
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
  StyleMode,
} from './types';
import { requestSelection, subscribeToSelection } from './ws-client';

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

function getStyleMode(element: HTMLElement): StyleMode {
  if (element.hasAttribute('style') && element.getAttribute('style')?.trim()) {
    return 'inline';
  }

  if (element.className && String(element.className).trim()) {
    return 'tailwind';
  }

  return 'unknown';
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

  return {
    element,
    rect: element.getBoundingClientRect(),
    source,
  } satisfies MeasuredElement;
}

function measureElementBySource(source: string) {
  return measureElement(getInspectableElementBySource(source));
}

function sameMeasuredElement(current: MeasuredElement | null, next: MeasuredElement | null) {
  return current?.element === next?.element && current?.source === next?.source;
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
    styleMode: getStyleMode(measured.element),
    tagName: measured.element.tagName.toLowerCase(),
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
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const draftsRef = useRef<Record<string, SelectionDraft>>({});
  const selectedSourceRef = useRef<string | null>(null);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    selectedSourceRef.current = selectedSource;
  }, [selectedSource]);

  function clearSessionDrafts() {
    for (const draft of Object.values(draftsRef.current)) {
      clearDraftOverrides(draft);
    }

    setDrafts({});
    setHovered(null);
    setSelected(null);
    setSelectedSource(null);
  }

  function refreshSelectedMeasurement(source: string, draftOverride?: SelectionDraft) {
    const nextMeasurement = measureElementBySource(source);

    if (nextMeasurement) {
      const nextDraft = draftOverride ?? draftsRef.current[source];

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

    const currentDraft = draftsRef.current[measured.source];
    const nextDraft = currentDraft
      ? mergeSelectionDraft(currentDraft, details)
      : createSelectionDraft(details, measured.element);

    applyDraftToElement(measured.element, nextDraft);
    setDrafts((current) => ({
      ...current,
      [measured.source]: nextDraft,
    }));

    return nextDraft;
  }

  function resetAllChanges() {
    const currentDrafts = Object.values(draftsRef.current);

    for (const draft of currentDrafts) {
      clearDraftOverrides(draft);
    }

    const lockedSource = selectedSource;

    if (!lockedSource) {
      setDrafts({});
      return;
    }

    const lockedMeasurement = measureElementBySource(lockedSource);
    const existingDraft = draftsRef.current[lockedSource];

    if (!lockedMeasurement || !existingDraft) {
      setDrafts({});
      setSelected(null);
      setSelectedSource(null);
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
      [lockedSource]: nextDraft,
    });
    setSelected(lockedMeasurement);
  }

  function updateDraftProperty(propertyId: EditablePropertyId, inputValue: string) {
    const source = selectedSource;

    if (!source) {
      return;
    }

    const currentDraft = drafts[source];
    const element = getInspectableElementBySource(source) ?? selected?.element ?? null;

    if (!currentDraft || !element) {
      return;
    }

    const nextSnapshot = applyDraftInputValue(
      element,
      propertyId,
      currentDraft.properties[propertyId],
      inputValue
    );

    const nextDraft = {
      ...currentDraft,
      properties: {
        ...currentDraft.properties,
        [propertyId]: nextSnapshot,
      },
    };

    setDrafts((current) => ({
      ...current,
      [source]: nextDraft,
    }));
    refreshSelectedMeasurement(source, nextDraft);
  }

  function resetProperty(source: string, propertyId: EditablePropertyId) {
    const currentDraft = drafts[source];

    if (!currentDraft) {
      return;
    }

    const element = getInspectableElementBySource(source);
    const nextSnapshot = resetDraftProperty(element, currentDraft, propertyId);
    const nextDraft = {
      ...currentDraft,
      properties: {
        ...currentDraft.properties,
        [propertyId]: nextSnapshot,
      },
    };

    setDrafts((current) => {
      if (source !== selectedSource && !hasDraftChanges(nextDraft)) {
        const nextDrafts = { ...current };
        delete nextDrafts[source];
        return nextDrafts;
      }

      return {
        ...current,
        [source]: nextDraft,
      };
    });

    if (source === selectedSource) {
      refreshSelectedMeasurement(source, nextDraft);
    }
  }

  useEffect(() => {
    return subscribeToSelection((payload) => {
      startTransition(() => {
        setDrafts((current) => {
          const existingDraft = current[payload.source];

          if (!existingDraft) {
            return current;
          }

          return {
            ...current,
            [payload.source]: mergeSelectionDraft(existingDraft, {
              ...existingDraft,
              ...payload,
            }),
          };
        });
      });
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearSessionDrafts();
      return;
    }

    const syncMeasurements = () => {
      setHovered((current) => (current ? measureElementBySource(current.source) : null));

      const lockedSource = selectedSourceRef.current;

      if (lockedSource) {
        refreshSelectedMeasurement(lockedSource);
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      if (selectedSourceRef.current) {
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
      setSelectedSource(nextMeasurement.source);
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
        const element = getInspectableElementBySource(draft.source);

        if (element) {
          applyDraftToElement(element, draft);
        }
      }

      const lockedSource = selectedSourceRef.current;

      if (lockedSource) {
        const nextMeasurement = measureElementBySource(lockedSource);
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

  const selectedDraft = selectedSource ? (drafts[selectedSource] ?? null) : null;
  const pendingDrafts = getDirtyDrafts(drafts).sort((left, right) => {
    if (left.source === selectedSource) {
      return -1;
    }

    if (right.source === selectedSource) {
      return 1;
    }

    return left.source.localeCompare(right.source);
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
