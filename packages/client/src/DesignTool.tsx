import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Inspector } from './Inspector';
import { hawkEyeStyles } from './styles';
import type { MeasuredElement, SelectionDetails, SelectionPayload, StyleMode } from './types';
import { requestSelection, subscribeToSelection } from './ws-client';

export interface DesignToolProps {
  // Phase 1 keeps the public API zero-config.
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

function sameMeasuredElement(current: MeasuredElement | null, next: MeasuredElement | null) {
  return current?.element === next?.element && current?.source === next?.source;
}

function getSelectableElementAtPoint(clientX: number, clientY: number) {
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
  const [hovered, setHovered] = useState<MeasuredElement | null>(null);
  const [selected, setSelected] = useState<MeasuredElement | null>(null);
  const [selectionPayload, setSelectionPayload] = useState<SelectionPayload | null>(null);
  const lockedSourceRef = useRef<string | null>(null);
  const selectedRef = useRef<MeasuredElement | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
    lockedSourceRef.current = selected?.source ?? null;
  }, [hovered, selected]);

  useEffect(() => {
    return subscribeToSelection((payload) => {
      if (lockedSourceRef.current === payload.source) {
        setSelectionPayload(payload);
      }
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setHovered(null);
      setSelected(null);
      setSelectionPayload(null);
      return;
    }

    const syncMeasurements = () => {
      setHovered((current) => measureElement(current?.element ?? null));
      setSelected((current) => measureElement(current?.element ?? null));
    };

    const handlePointerMove = (event: MouseEvent) => {
      if (selectedRef.current) {
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

      setSelected(nextMeasurement);
      setSelectionPayload(parseSourceToken(nextMeasurement.source));
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

  const selectionDetails = buildSelectionDetails(selected, selectionPayload);

  return (
    <Inspector
      enabled={enabled}
      hovered={hovered}
      onToggle={() => setEnabled((current) => !current)}
      selected={selected}
      selectionDetails={selectionDetails}
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
