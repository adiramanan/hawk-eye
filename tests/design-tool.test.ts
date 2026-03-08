// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DesignTool } from '../packages/client/src';
import type { SelectionPayload } from '../packages/client/src/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

  return {
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
    host,
    shadowRoot: host.shadowRoot,
  };
}

function click(node: Element | Window | Document) {
  act(() => {
    node.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 })
    );
  });
}

function pointerMove(node: Document) {
  act(() => {
    node.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 20, clientY: 20 }));
  });
}

function pressEscape() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
  });
}

afterEach(() => {
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

  it('tracks hovered selectable elements and shows measurements', () => {
    const target = document.createElement('button');
    target.dataset.source = 'demo/src/App.tsx:10:5';
    mockRect(target, { height: 48, left: 40, top: 64, width: 120 });
    document.body.append(target);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => target),
    });

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    pointerMove(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="measure"]')?.textContent).toContain(
      '120 x 48'
    );
    cleanup();
  });

  it('locks selection on click and requests source details over the HMR bridge', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('button');
    target.className = 'rounded-lg bg-indigo-600';
    target.dataset.source = 'demo/src/App.tsx:21:13';
    mockRect(target, { height: 40, left: 32, top: 80, width: 144 });
    document.body.append(target);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => target),
    });

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
    expect(shadowRoot.textContent).toContain('tailwind');
    cleanup();
  });

  it('exits inspector mode on Escape', () => {
    const target = document.createElement('div');
    target.dataset.source = 'demo/src/App.tsx:8:7';
    mockRect(target, { height: 32, left: 24, top: 24, width: 96 });
    document.body.append(target);

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => target),
    });

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);
    pressEscape();

    expect(shadowRoot.textContent).not.toContain('Locked selection');
    expect(shadowRoot.textContent).toContain('Inspect with Hawk-Eye');
    cleanup();
  });

  it('ignores Hawk-Eye overlay nodes during hit testing', () => {
    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => host),
    });

    click(trigger);
    pointerMove(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="measure"]')).toBeNull();
    cleanup();
  });
});
