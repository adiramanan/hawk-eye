// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DesignTool } from '../packages/client/src';
import type { SelectionPayload } from '../packages/client/src/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mountedCleanups = new Set<() => void>();

interface HotStub {
  emit(event: string, payload: SelectionPayload): void;
  off(event: string, cb: (payload: SelectionPayload) => void): void;
  on(event: string, cb: (payload: SelectionPayload) => void): void;
  send: ReturnType<typeof vi.fn>;
}

function createHotStub(): HotStub {
  const handlers = new Map<string, Set<(payload: SelectionPayload) => void>>();

  return {
    emit(event, payload) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
    off(event, cb) {
      handlers.get(event)?.delete(cb);
    },
    on(event, cb) {
      const callbacks = handlers.get(event) ?? new Set<(payload: SelectionPayload) => void>();
      callbacks.add(cb);
      handlers.set(event, callbacks);
    },
    send: vi.fn(),
  };
}

function mockRect(element: HTMLElement, rect: Partial<DOMRect>) {
  const fallback = {
    bottom: (rect.top ?? 0) + (rect.height ?? 0),
    height: rect.height ?? 0,
    left: rect.left ?? 0,
    right: (rect.left ?? 0) + (rect.width ?? 0),
    toJSON: () => undefined,
    top: rect.top ?? 0,
    width: rect.width ?? 0,
    x: rect.left ?? 0,
    y: rect.top ?? 0,
  } satisfies DOMRect;

  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => fallback,
  });
}

function applyBaselineStyles(element: HTMLElement, source: string) {
  element.dataset.source = source;
  element.style.paddingTop = '16px';
  element.style.paddingRight = '20px';
  element.style.paddingBottom = '12px';
  element.style.paddingLeft = '18px';
  element.style.marginTop = '8px';
  element.style.marginRight = '4px';
  element.style.marginBottom = '10px';
  element.style.marginLeft = '6px';
  element.style.borderRadius = '14px';
  element.style.backgroundColor = 'rgb(10, 20, 30)';
  element.style.color = 'rgb(200, 210, 220)';
  element.style.fontSize = '18px';
  element.style.fontWeight = '600';
  element.style.lineHeight = '24px';
  element.style.opacity = '0.8';
}

function renderDesignTool() {
  const container = document.createElement('div');
  document.body.append(container);

  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(DesignTool));
  });

  const host = document.querySelector('[data-hawk-eye-ui="host"]') as HTMLDivElement | null;

  if (!host?.shadowRoot) {
    throw new Error('Hawk-Eye shadow root was not created');
  }

  const cleanup = () => {
    if (!mountedCleanups.has(cleanup)) {
      return;
    }

    mountedCleanups.delete(cleanup);

    act(() => {
      root.unmount();
    });
    container.remove();
  };

  mountedCleanups.add(cleanup);

  return {
    cleanup() {
      cleanup();
    },
    debugText() {
      return host.shadowRoot?.textContent ?? '';
    },
    host,
    shadowRoot: host.shadowRoot,
  };
}

function click(node: Element | Window | Document) {
  act(() => {
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 20,
        clientY: 20,
        composed: true,
      })
    );
  });
}

function pointerMove(node: Document) {
  act(() => {
    node.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 20, clientY: 20, composed: true })
    );
  });
}

function pressEscape() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
  });
}

function updateInput(input: InstanceType<typeof window.HTMLInputElement>, value: string) {
  const prototype = Object.getPrototypeOf(input);
  const setValue =
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set ??
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

  if (!setValue) {
    throw new Error('Could not find native input value setter');
  }

  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new window.Event('change', { bubbles: true, composed: true }));
  });
}

function setElementFromPoint(target: HTMLElement | null) {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => target),
  });
}

function getControl(
  shadowRoot: { querySelector(selectors: string): Element | null },
  propertyId: string
) {
  const input = shadowRoot.querySelector(`[data-hawk-eye-control="${propertyId}"]`);

  if (!(input instanceof window.HTMLInputElement)) {
    throw new Error(`Could not find control ${propertyId}`);
  }

  return input;
}

afterEach(() => {
  for (const cleanup of Array.from(mountedCleanups)) {
    cleanup();
  }

  delete globalThis.__HAWK_EYE_HOT__;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('DesignTool', () => {
  it('toggles inspector mode from the floating trigger', () => {
    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]');

    expect(shadowRoot.textContent).not.toContain('Inspector active');

    click(trigger as Element);
    expect(shadowRoot.textContent).toContain('Inspector active');

    click(trigger as Element);
    expect(shadowRoot.textContent).not.toContain('Inspector active');
    cleanup();
  });

  it('locks selection, requests source details, and hydrates the property controls', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('button');
    applyBaselineStyles(target, 'demo/src/App.tsx:21:13');
    mockRect(target, { height: 40, left: 32, top: 80, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    pointerMove(document);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:21:13',
        file: 'demo/src/App.tsx',
        line: 21,
        column: 13,
      });
    });

    expect(hot.send).toHaveBeenCalledWith('hawk-eye:inspect', { source: 'demo/src/App.tsx:21:13' });
    expect(shadowRoot.textContent).toContain('Locked selection');
    expect(shadowRoot.textContent).toContain('demo/src/App.tsx:21:13');
    expect(getControl(shadowRoot, 'paddingTop').value).toBe('16px');
    expect(getControl(shadowRoot, 'borderRadius').value).toBe('14px');
    expect(getControl(shadowRoot, 'fontWeight').value).toBe('600');
    expect(getControl(shadowRoot, 'opacity-number').value).toBe('0.8');
    cleanup();
  });

  it('applies live preview edits and keeps invalid text visible without replacing the last valid preview', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:8:7');
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;
    const paddingTopInput = () => getControl(shadowRoot, 'paddingTop');

    click(trigger);
    click(document);

    updateInput(paddingTopInput(), '24px');
    expect(target.style.paddingTop).toBe('24px');
    expect(shadowRoot.textContent).toContain('16px -> 24px');

    updateInput(paddingTopInput(), 'banana');
    expect(target.style.paddingTop).toBe('24px');
    expect(paddingTopInput().value).toBe('banana');
    expect(shadowRoot.textContent).toContain('Invalid value. Preview stays at 24px.');
    cleanup();
  });

  it('supports per-field reset and resetting all preview changes', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:11:5');
    mockRect(target, { height: 56, left: 24, top: 40, width: 140 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateInput(getControl(shadowRoot, 'paddingTop'), '24px');
    updateInput(getControl(shadowRoot, 'opacity-number'), '0.5');

    const paddingReset = shadowRoot.querySelector(
      '[data-property-id="paddingTop"] [data-hawk-eye-ui="control-reset"]'
    );

    if (!(paddingReset instanceof window.HTMLButtonElement)) {
      throw new Error('Missing padding reset button');
    }

    setElementFromPoint(host);
    click(paddingReset);

    expect(target.style.paddingTop).toBe('16px');
    expect(target.style.opacity).toBe('0.5');

    const resetAll = shadowRoot.querySelector('[data-hawk-eye-ui="secondary-button"]');

    if (!(resetAll instanceof window.HTMLButtonElement)) {
      throw new Error('Missing reset all button');
    }

    setElementFromPoint(host);
    click(resetAll);

    expect(target.style.paddingTop).toBe('16px');
    expect(target.style.opacity).toBe('0.8');
    expect(shadowRoot.textContent).not.toContain('0.8 -> 0.5');
    expect(shadowRoot.textContent).toContain('Live preview changes stay in this session only.');
    cleanup();
  });

  it('preserves preview drafts across selections and restores them when reselected', () => {
    const first = document.createElement('button');
    applyBaselineStyles(first, 'demo/src/App.tsx:20:5');
    mockRect(first, { height: 40, left: 24, top: 40, width: 144 });
    document.body.append(first);

    const second = document.createElement('div');
    applyBaselineStyles(second, 'demo/src/App.tsx:38:9');
    second.style.paddingTop = '10px';
    second.style.marginTop = '2px';
    mockRect(second, { height: 96, left: 220, top: 40, width: 180 });
    document.body.append(second);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);

    setElementFromPoint(first);
    click(document);
    updateInput(getControl(shadowRoot, 'paddingTop'), '24px');

    setElementFromPoint(second);
    click(document);
    updateInput(getControl(shadowRoot, 'marginTop'), '12px');

    expect(first.style.paddingTop).toBe('24px');
    expect(second.style.marginTop).toBe('12px');
    expect(shadowRoot.textContent).toContain('demo/src/App.tsx:20:5');
    expect(shadowRoot.textContent).toContain('demo/src/App.tsx:38:9');

    setElementFromPoint(first);
    click(document);

    expect(getControl(shadowRoot, 'paddingTop').value).toBe('24px');
    cleanup();
  });

  it('clears all session previews when the inspector exits', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:14:3');
    mockRect(target, { height: 44, left: 24, top: 40, width: 132 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);
    updateInput(getControl(shadowRoot, 'paddingTop'), '28px');

    expect(target.style.paddingTop).toBe('28px');
    pressEscape();

    expect(target.style.paddingTop).toBe('16px');
    expect(shadowRoot.textContent).toContain('Inspect with Hawk-Eye');
    expect(shadowRoot.textContent).not.toContain('Reset all changes');
    cleanup();
  });

  it('ignores Hawk-Eye overlay nodes during hit testing', () => {
    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    setElementFromPoint(host);

    click(trigger);
    pointerMove(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="measure"]')).toBeNull();
    cleanup();
  });
});
