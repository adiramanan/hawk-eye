// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../shared/protocol';
import { DesignTool } from '../packages/client/src';
import type {
  SaveResult,
  SelectionPayload,
  StyleAnalysisPayload,
} from '../packages/client/src/types';
import {
  HAWK_EYE_ANALYZE_STYLE_EVENT,
  HAWK_EYE_INSPECT_EVENT,
  HAWK_EYE_SAVE_EVENT,
} from '../packages/client/src/ws-client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SAVE_CAPABILITY = 'test-save-capability';
const SHELL_HANDOFF_DURATION_MS = 220;
const VIEW_TRANSITION_DURATION_MS = 180;
const STATUS_TRANSITION_DURATION_MS = 160;

const mountedCleanups = new Set<() => void>();

interface HotStub {
  emit(event: string, payload: SelectionPayload | StyleAnalysisPayload | SaveResult): void;
  off(
    event: string,
    cb: (payload: SelectionPayload | StyleAnalysisPayload | SaveResult) => void
  ): void;
  on(
    event: string,
    cb: (payload: SelectionPayload | StyleAnalysisPayload | SaveResult) => void
  ): void;
  send: ReturnType<typeof vi.fn>;
}

function createHotStub(): HotStub {
  const handlers = new Map<
    string,
    Set<(payload: SelectionPayload | StyleAnalysisPayload | SaveResult) => void>
  >();

  return {
    emit(event, payload) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
    off(event, cb) {
      handlers.get(event)?.delete(cb);
    },
    on(event, cb) {
      const callbacks =
        handlers.get(event) ??
        new Set<(payload: SelectionPayload | StyleAnalysisPayload | SaveResult) => void>();
      callbacks.add(cb);
      handlers.set(event, callbacks);
    },
    send: vi.fn(),
  };
}

function createStyleAnalysisPayload(
  overrides: Partial<StyleAnalysisPayload> & Pick<StyleAnalysisPayload, 'source' | 'fingerprint'>
): StyleAnalysisPayload {
  return {
    source: overrides.source,
    mode: 'tailwind',
    classNames: [],
    classTargets: [],
    inlineStyles: {},
    classAttributeState: 'literal',
    styleAttributeState: 'missing',
    fingerprint: overrides.fingerprint,
    saveCapability: SAVE_CAPABILITY,
    saveEnabled: true,
    ...overrides,
  };
}

function createClassTarget(
  overrides: Partial<StyleAnalysisPayload['classTargets'][number]> &
    Pick<StyleAnalysisPayload['classTargets'][number], 'id' | 'className' | 'file' | 'line' | 'column' | 'selector' | 'fingerprint'>
) {
  return {
    ...overrides,
    declaredCssValues: overrides.declaredCssValues ?? {},
    declaredPropertyIds: overrides.declaredPropertyIds ?? [],
    label: overrides.label ?? `.${overrides.className}`,
  };
}

function expectHotSendWithPayload(hot: HotStub, event: string, payload: Record<string, unknown>) {
  expect(hot.send).toHaveBeenCalledWith(
    event,
    expect.objectContaining({
      ...payload,
      clientId: expect.any(String),
    })
  );
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
  element.setAttribute(HAWK_EYE_SOURCE_ATTRIBUTE, source);
  element.style.paddingTop = '16px';
  element.style.paddingRight = '20px';
  element.style.paddingBottom = '12px';
  element.style.paddingLeft = '18px';
  element.style.marginTop = '8px';
  element.style.marginRight = '4px';
  element.style.marginBottom = '10px';
  element.style.marginLeft = '6px';
  element.style.borderRadius = '14px';
  element.style.borderTopLeftRadius = '14px';
  element.style.borderTopRightRadius = '14px';
  element.style.borderBottomRightRadius = '14px';
  element.style.borderBottomLeftRadius = '14px';
  element.style.backgroundColor = 'rgb(10, 20, 30)';
  element.style.color = 'rgb(200, 210, 220)';
  element.style.borderColor = 'rgb(148, 163, 184)';
  element.style.borderStyle = 'solid';
  element.style.borderTopWidth = '1px';
  element.style.borderRightWidth = '1px';
  element.style.borderBottomWidth = '1px';
  element.style.borderLeftWidth = '1px';
  element.style.boxShadow = '0px 4px 12px rgba(15, 23, 42, 0.18)';
  element.style.fontSize = '18px';
  element.style.fontWeight = '600';
  element.style.textAlign = 'left';
  element.style.lineHeight = '24px';
  element.style.fontFamily = 'Inter, sans-serif';
  element.style.opacity = '0.8';
  element.style.width = '120px';
  element.style.height = '48px';
  element.style.display = 'block';
  element.style.position = 'relative';
  element.style.overflow = 'visible';
  element.style.top = '0px';
  element.style.right = 'auto';
  element.style.bottom = 'auto';
  element.style.left = '0px';
  element.style.zIndex = '2';
  element.style.flexDirection = 'row';
  element.style.flexWrap = 'nowrap';
  element.style.justifyContent = 'flex-start';
  element.style.alignItems = 'stretch';
  element.style.alignSelf = 'auto';
  element.style.gap = '16px';
  element.style.rowGap = '12px';
  element.style.columnGap = '8px';
}

function renderDesignTool() {
  const container = document.createElement('div');
  document.body.append(container);

  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(DesignTool));
  });

  const host = document.querySelector('[data-hawk-eye-ui="host"]') as HTMLDivElement | null;
  const shadowRoot = (host as unknown as Record<string, unknown>)?.__hawkEyeShadowRoot as ShadowRoot | undefined;

  if (!host || !shadowRoot) {
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
      return shadowRoot?.textContent ?? '';
    },
    host,
    shadowRoot,
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
        detail: 1,
      })
    );
  });
}

function keyboardClick(node: Element) {
  act(() => {
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 20,
        clientY: 20,
        composed: true,
        detail: 0,
      })
    );
  });
}

function advanceMotion(duration: number) {
  act(() => {
    vi.advanceTimersByTime(duration);
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

function keyDown(node: Element | Window | Document, key: string) {
  act(() => {
    node.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        composed: true,
        key,
      })
    );
  });
}

function dispatchBeforeUnload() {
  const event = new window.Event('beforeunload', {
    bubbles: true,
    cancelable: true,
    composed: true,
  }) as InstanceType<typeof window.Event> & { returnValue: string | undefined };

  Object.defineProperty(event, 'returnValue', {
    configurable: true,
    enumerable: true,
    value: undefined,
    writable: true,
  });

  act(() => {
    window.dispatchEvent(event);
  });

  return event;
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

function pressInputKey(
  input: InstanceType<typeof window.HTMLInputElement>,
  key: string,
  options: KeyboardEventInit = {}
) {
  act(() => {
    input.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        composed: true,
        key,
        ...options,
      })
    );
  });
}

function updateSelect(select: InstanceType<typeof window.HTMLSelectElement>, value: string) {
  const prototype = Object.getPrototypeOf(select);
  const setValue =
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set ??
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;

  if (!setValue) {
    throw new Error('Could not find native select value setter');
  }

  act(() => {
    setValue.call(select, value);
    select.dispatchEvent(new window.Event('input', { bubbles: true, composed: true }));
    select.dispatchEvent(new window.Event('change', { bubbles: true, composed: true }));
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

  if (!(input instanceof window.HTMLInputElement) && !(input instanceof window.HTMLSelectElement)) {
    throw new Error(`Could not find control ${propertyId}`);
  }

  return input;
}

function getButtonControl(
  shadowRoot: { querySelector(selectors: string): Element | null },
  controlId: string
) {
  const button = shadowRoot.querySelector(`[data-hawk-eye-control="${controlId}"]`);

  if (!(button instanceof window.HTMLButtonElement)) {
    throw new Error(`Could not find button control ${controlId}`);
  }

  return button;
}

function getPanelTab(
  shadowRoot: { querySelector(selectors: string): Element | null },
  view: 'properties' | 'layers'
) {
  const button = shadowRoot.querySelector(
    `[data-hawk-eye-ui="panel-tab"][data-view="${view}"]`
  );

  if (!(button instanceof window.HTMLButtonElement)) {
    throw new Error(`Could not find panel tab ${view}`);
  }

  return button;
}

function getFooterApplyButton(shadowRoot: { querySelector(selectors: string): Element | null }) {
  const button = shadowRoot.querySelector('[data-hawk-eye-ui="footer-apply-btn"]');

  if (!(button instanceof window.HTMLButtonElement)) {
    throw new Error('Could not find footer apply button');
  }

  return button;
}

function getFooterButton(
  shadowRoot: { querySelector(selectors: string): Element | null },
  ui: string
) {
  const button = shadowRoot.querySelector(`[data-hawk-eye-ui="${ui}"]`);

  if (!(button instanceof window.HTMLButtonElement)) {
    throw new Error(`Could not find footer button ${ui}`);
  }

  return button;
}

function chooseSizeMenuOption(
  shadowRoot: { querySelector(selectors: string): Element | null },
  triggerId: string,
  optionValue: string
) {
  click(getButtonControl(shadowRoot, triggerId));
  const option = shadowRoot.querySelector(
    `[data-hawk-eye-control="${triggerId}-option-${optionValue}"]`
  );

  if (!(option instanceof window.HTMLButtonElement)) {
    throw new Error(`Could not find option ${optionValue} for ${triggerId}`);
  }

  click(option);
}

function getInputByLabel(
  shadowRoot: { querySelector(selectors: string): Element | null },
  label: string
) {
  const input = shadowRoot.querySelector(`[aria-label="${label}"]`);

  if (!(input instanceof window.HTMLInputElement) && !(input instanceof window.HTMLSelectElement)) {
    throw new Error(`Could not find input with label ${label}`);
  }

  return input;
}

afterEach(() => {
  for (const cleanup of Array.from(mountedCleanups)) {
    cleanup();
  }

  delete globalThis.__HAWK_EYE_HOT__;
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DesignTool', () => {
  it('toggles inspector mode from the floating trigger', () => {
    vi.useFakeTimers();
    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]');

    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute('data-state')).toBe('closed');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).toBeNull();

    click(trigger as Element);
    expect(shadowRoot.textContent).toContain('Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')?.getAttribute('data-state')).toBe(
      'opening'
    );
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')?.getAttribute('data-state')
    ).toBe('exiting');

    advanceMotion(SHELL_HANDOFF_DURATION_MS);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')?.getAttribute('data-state')).toBe(
      'open'
    );
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')).toBeNull();

    click(shadowRoot.querySelector('[data-hawk-eye-ui="panel-close-btn"]') as Element);
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')?.getAttribute('data-state')).toBe(
      'closing'
    );
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')?.getAttribute('data-state')
    ).toBe('entering');

    advanceMotion(SHELL_HANDOFF_DURATION_MS);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')).not.toBeNull();
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')?.getAttribute('data-state')
    ).toBe('closed');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).toBeNull();
    cleanup();
  });

  it('opens from keyboard and closes instantly on escape without an animated handoff', () => {
    vi.useFakeTimers();
    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]');

    if (!(trigger instanceof window.HTMLButtonElement)) {
      throw new Error('Missing trigger button');
    }

    keyboardClick(trigger);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')?.getAttribute('data-state')).toBe(
      'open'
    );
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')).toBeNull();

    pressEscape();

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).toBeNull();
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]')?.getAttribute('data-state')
    ).toBe('closed');
    cleanup();
  });

  it('renders the Hawk-Eye brand mark inline instead of relying on an external image asset', () => {
    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;
    const triggerBrand = shadowRoot.querySelector('[data-hawk-eye-ui="trigger-brand-image"]');

    expect(triggerBrand?.tagName.toLowerCase()).toBe('svg');
    expect(triggerBrand?.getAttribute('viewBox')).toBe('0 0 96 96');

    click(trigger);

    const panelBrand = shadowRoot.querySelector('[data-hawk-eye-ui="panel-brand-image"]');
    expect(panelBrand?.tagName.toLowerCase()).toBe('svg');
    expect(shadowRoot.querySelector('img[data-hawk-eye-ui="trigger-brand-image"]')).toBeNull();
    expect(shadowRoot.querySelector('img[data-hawk-eye-ui="panel-brand-image"]')).toBeNull();
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
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    expectHotSendWithPayload(hot, HAWK_EYE_INSPECT_EVENT, {
      source: 'demo/src/App.tsx:21:13',
    });
    expectHotSendWithPayload(hot, HAWK_EYE_ANALYZE_STYLE_EVENT, {
      source: 'demo/src/App.tsx:21:13',
    });
    expect(shadowRoot.textContent).toContain('Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel-source"]')).toBeNull();
    expect(
      Array.from(shadowRoot.querySelectorAll('[data-hawk-eye-ui="group-title"]')).map((node) =>
        node.textContent?.trim()
      )
    ).toEqual(['Spacing', 'Appearance', 'Typography', 'Border']);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="positionSize"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="fillOpacity"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="border"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="typography"]')).toHaveLength(1);
    expect(getControl(shadowRoot, 'paddingTop').value).toBe('16');
    expect(getInputByLabel(shadowRoot, 'Corner Radius all sides').value).toBe('14');
    expect(getControl(shadowRoot, 'fontWeight').value).toBe('600');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="backgroundColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="opacity"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="aspect-ratio-lock-button"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="fontFamily"]')).not.toBeNull();

    act(() => {
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:21:13',
          mode: 'tailwind',
          classNames: ['px-4', 'py-2', 'rounded-lg'],
          fingerprint: 'fp-21-13',
        })
      );
    });

    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    cleanup();
  });

  it('shows the Appearance fill control for chip-like span selections with a visible background', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('span');
    target.textContent = 'Headline';
    applyBaselineStyles(target, 'demo/src/App.tsx:23:15');
    target.style.background = 'rgb(10, 20, 30)';
    target.style.display = 'inline';
    target.style.width = '';
    target.style.height = '';
    mockRect(target, { height: 28, left: 40, top: 96, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    pointerMove(document);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:23:15',
        file: 'demo/src/App.tsx',
        line: 23,
        column: 15,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="fillOpacity"]')).toHaveLength(1);
    expect(shadowRoot.querySelector('[data-hawk-eye-control="backgroundColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="opacity"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="color"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    cleanup();
  });

  it('keeps the Appearance fill control hidden for paragraph selections', () => {
    const target = document.createElement('p');
    target.textContent = 'Paragraph copy';
    applyBaselineStyles(target, 'demo/src/App.tsx:24:11');
    mockRect(target, { height: 48, left: 40, top: 120, width: 220 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="backgroundColor"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="color"]')).not.toBeNull();
    cleanup();
  });

  it('keeps the Appearance fill control hidden for plain heading selections without a visible background', () => {
    const target = document.createElement('h1');
    target.textContent = 'Heading';
    applyBaselineStyles(target, 'demo/src/App.tsx:24:15');
    target.style.background = 'rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box';
    target.style.backgroundColor = 'transparent';
    target.style.backgroundImage = 'none';
    mockRect(target, { height: 72, left: 40, top: 120, width: 320 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="backgroundColor"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="color"]')).not.toBeNull();
    cleanup();
  });

  it('keeps width and height controls hidden for semantic block elements like aside in v1', () => {
    const target = document.createElement('aside');
    applyBaselineStyles(target, 'demo/src/App.tsx:24:7');
    mockRect(target, { height: 96, left: 40, top: 96, width: 180 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    cleanup();
  });

  it('detaches class-based selections and preserves detached mode across later style-analysis events', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('button');
    applyBaselineStyles(target, 'demo/src/App.tsx:34:9');
    mockRect(target, { height: 44, left: 36, top: 72, width: 148 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:34:9',
        file: 'demo/src/App.tsx',
        line: 34,
        column: 9,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:34:9',
          mode: 'tailwind',
          classNames: ['px-4', 'py-2', 'rounded-lg'],
          fingerprint: 'fp-34-9',
        })
      );
    });

    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    expect(target.style.paddingTop).toBe('16px');

    act(() => {
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:34:9',
          mode: 'tailwind',
          classNames: ['px-4', 'py-2', 'rounded-lg'],
          fingerprint: 'fp-34-9',
        })
      );
    });

    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    cleanup();
  });

  it('shows authored class targets in the panel and previews edits across every matching element', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const style = document.createElement('style');
    style.textContent = '.dense { padding-top: 16px; }';
    document.head.append(style);

    const target = document.createElement('button');
    target.className = 'dense';
    applyBaselineStyles(target, 'demo/src/App.tsx:42:7');
    mockRect(target, { height: 44, left: 36, top: 72, width: 148 });

    const peer = document.createElement('button');
    peer.className = 'dense';
    applyBaselineStyles(peer, 'demo/src/App.tsx:43:7');
    mockRect(peer, { height: 44, left: 196, top: 72, width: 148 });

    document.body.append(target, peer);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:42:7',
        file: 'demo/src/App.tsx',
        line: 42,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:42:7',
          mode: 'unknown',
          classNames: ['dense'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::dense',
              className: 'dense',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.dense',
              fingerprint: 'dense-fp',
            }),
          ],
          fingerprint: 'fp-42-7',
        })
      );
    });

    const classTargetSelect = getInputByLabel(shadowRoot, 'Class target');
    expect(classTargetSelect.value).toBe('src/styles.css::dense');
    expect(shadowRoot.textContent).toContain('Editing');
    expect(shadowRoot.textContent).toContain('Detach');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    expect(target.style.paddingTop).toBe('24px');
    expect(
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent
    ).toContain('.dense');
    expect(
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent
    ).toContain('padding-top: 24px !important;');

    cleanup();
    style.remove();
  });

  it('rebases untouched class-backed panel values when style analysis refreshes a dirty draft', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    target.className = 'dense';
    applyBaselineStyles(target, 'demo/src/App.tsx:44:7');
    mockRect(target, { height: 64, left: 36, top: 72, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:44:7',
        file: 'demo/src/App.tsx',
        line: 44,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:44:7',
          mode: 'unknown',
          classNames: ['dense'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::dense',
              className: 'dense',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.dense',
              fingerprint: 'dense-fp-1',
              declaredPropertyIds: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
              declaredCssValues: {
                padding: '12px',
              },
            }),
          ],
          fingerprint: 'fp-44-7-a',
        })
      );
    });

    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe(
      '12'
    );

    updateInput(
      getControl(shadowRoot, 'backgroundColor') as InstanceType<typeof window.HTMLInputElement>,
      '#ff0000'
    );

    act(() => {
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:44:7',
          mode: 'unknown',
          classNames: ['dense'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::dense',
              className: 'dense',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.dense',
              fingerprint: 'dense-fp-2',
              declaredPropertyIds: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
              declaredCssValues: {
                padding: '20px',
              },
            }),
          ],
          fingerprint: 'fp-44-7-b',
        })
      );
    });

    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe(
      '20'
    );
    expect(
      (getControl(shadowRoot, 'backgroundColor') as InstanceType<typeof window.HTMLInputElement>).value
    ).toBe('#ff0000');

    cleanup();
  });

  it('keeps the selected class-target initialization while reselection waits for fresh analysis', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    target.className = 'filled framed';
    applyBaselineStyles(target, 'demo/src/App.tsx:45:7');
    mockRect(target, { height: 64, left: 36, top: 72, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:45:7',
        file: 'demo/src/App.tsx',
        line: 45,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:45:7',
          mode: 'unknown',
          classNames: ['filled', 'framed'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::filled',
              className: 'filled',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.filled',
              fingerprint: 'filled-fp',
              declaredPropertyIds: ['backgroundColor'],
              declaredCssValues: {
                'background-color': 'rgb(17, 24, 39)',
              },
            }),
            createClassTarget({
              id: 'src/styles.css::framed',
              className: 'framed',
              file: 'src/styles.css',
              line: 2,
              column: 1,
              selector: '.framed',
              fingerprint: 'framed-fp',
              declaredPropertyIds: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
              declaredCssValues: {
                padding: '12px',
              },
            }),
          ],
          fingerprint: 'fp-45-7-a',
        })
      );
    });

    updateSelect(
      getInputByLabel(shadowRoot, 'Class target') as InstanceType<typeof window.HTMLSelectElement>,
      'src/styles.css::framed'
    );
    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe(
      '12'
    );

    setElementFromPoint(target);
    click(document);

    const classTargetSelect = shadowRoot.querySelector(
      '[aria-label="Class target"]'
    ) as InstanceType<typeof window.HTMLSelectElement> | null;

    expect(classTargetSelect).not.toBeNull();
    expect(classTargetSelect?.value).toBe('src/styles.css::framed');
    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe(
      '12'
    );

    cleanup();
  });

  it('keeps authored class-target preview when switching selection without re-analyzing peers', async () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const style = document.createElement('style');
    style.textContent = '.dense { padding-top: 16px; }';
    document.head.append(style);

    const target = document.createElement('button');
    target.className = 'dense';
    applyBaselineStyles(target, 'demo/src/App.tsx:42:7');
    mockRect(target, { height: 44, left: 36, top: 72, width: 148 });

    const peer = document.createElement('button');
    peer.className = 'dense';
    applyBaselineStyles(peer, 'demo/src/App.tsx:43:7');
    mockRect(peer, { height: 44, left: 196, top: 72, width: 148 });

    document.body.append(target, peer);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:42:7',
        file: 'demo/src/App.tsx',
        line: 42,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:42:7',
          mode: 'unknown',
          classNames: ['dense'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::dense',
              className: 'dense',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.dense',
              fingerprint: 'dense-fp',
            }),
          ],
          fingerprint: 'fp-42-7',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    // Peer should have the authored class-target preview rule active.
    expect(
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent
    ).toContain('padding-top: 24px !important;');

    // Switch selection to "B" but do NOT emit style analysis for B.
    // The class-target preview should remain derived from A's dirty class-target draft.
    setElementFromPoint(peer);
    click(document);

    await act(async () => {
      await Promise.resolve();
    });

    expect(peer.className).toBe('dense');

    const previewCssAfterSelection =
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent ?? '';
    expect(previewCssAfterSelection).toContain('padding-top: 24px !important;');

    const paddingTopImportantValues = Array.from(
      previewCssAfterSelection.matchAll(/padding-top:\s*(\d+px)\s*!important;/g)
    ).map((m) => m[1]);
    expect(paddingTopImportantValues.length).toBeGreaterThan(0);
    expect(paddingTopImportantValues[paddingTopImportantValues.length - 1]).toBe('24px');

    expect(
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent
    ).toContain('padding-top: 24px !important;');

    cleanup();
    style.remove();
  });

  it('rebases dirty class-target edits instead of carrying them to a newly selected class target', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const style = document.createElement('style');
    style.textContent = `
      .dense { padding-top: 16px; }
      .roomy { padding-top: 40px; }
    `;
    document.head.append(style);

    const target = document.createElement('button');
    target.className = 'dense roomy';
    applyBaselineStyles(target, 'demo/src/App.tsx:48:7');
    target.style.paddingTop = '';
    mockRect(target, { height: 44, left: 36, top: 72, width: 148 });

    const peer = document.createElement('button');
    peer.className = 'roomy';
    applyBaselineStyles(peer, 'demo/src/App.tsx:49:7');
    peer.style.paddingTop = '';
    mockRect(peer, { height: 44, left: 196, top: 72, width: 148 });

    document.body.append(target, peer);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:48:7',
        file: 'demo/src/App.tsx',
        line: 48,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:48:7',
          mode: 'unknown',
          classNames: ['dense', 'roomy'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::dense',
              className: 'dense',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.dense',
              fingerprint: 'dense-fp',
            }),
            createClassTarget({
              id: 'src/styles.css::roomy',
              className: 'roomy',
              file: 'src/styles.css',
              line: 2,
              column: 1,
              selector: '.roomy',
              fingerprint: 'roomy-fp',
            }),
          ],
          fingerprint: 'fp-48-7',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    expect(
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent
    ).toContain('.dense');
    expect(peer.style.paddingTop).toBe('');
    expect(window.getComputedStyle(peer).paddingTop).toBe('40px');

    const classTargetSelect = shadowRoot.querySelector(
      '[aria-label="Class target"]'
    ) as InstanceType<typeof window.HTMLSelectElement> | null;

    if (!classTargetSelect) {
      throw new Error('Missing class target select');
    }

    act(() => {
      classTargetSelect.value = 'src/styles.css::roomy';
      classTargetSelect.dispatchEvent(new window.Event('change', { bubbles: true }));
    });

    const previewCss =
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent ?? '';
    expect(previewCss).not.toContain('.roomy');
    expect(previewCss).not.toContain('padding-top: 24px !important;');
    expect(target.style.paddingTop).toBe('');
    expect(peer.style.paddingTop).toBe('');
    expect(window.getComputedStyle(peer).paddingTop).toBe('40px');

    cleanup();
    style.remove();
  });

  it('keeps all groups visible while only initializing the selected class target properties, then restores full values when detached', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    target.className = 'filled framed';
    applyBaselineStyles(target, 'demo/src/App.tsx:50:7');
    mockRect(target, { height: 64, left: 36, top: 72, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:50:7',
        file: 'demo/src/App.tsx',
        line: 50,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:50:7',
          mode: 'unknown',
          classNames: ['filled', 'framed'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::filled',
              className: 'filled',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.filled',
              fingerprint: 'filled-fp',
              declaredPropertyIds: ['backgroundColor'],
              declaredCssValues: {
                'background-color': 'rgb(17, 24, 39)',
              },
            }),
            createClassTarget({
              id: 'src/styles.css::framed',
              className: 'framed',
              file: 'src/styles.css',
              line: 2,
              column: 1,
              selector: '.framed',
              fingerprint: 'framed-fp',
              declaredPropertyIds: [
                'paddingTop',
                'paddingRight',
                'paddingBottom',
                'paddingLeft',
                'borderStyle',
                'borderColor',
                'borderTopWidth',
                'borderRightWidth',
                'borderBottomWidth',
                'borderLeftWidth',
              ],
              declaredCssValues: {
                padding: '12px',
                border: '2px solid #d1d5db',
              },
            }),
          ],
          fingerprint: 'fp-50-7',
        })
      );
    });

    expect(shadowRoot.querySelector('[data-property-id="backgroundColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="padding"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="borderStyle"]')).not.toBeNull();
    expect((getControl(shadowRoot, 'backgroundColor') as InstanceType<typeof window.HTMLInputElement>).value).toBe('#111827');
    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe('');
    expect((getControl(shadowRoot, 'borderStyle') as InstanceType<typeof window.HTMLSelectElement>).value).toBe('');

    updateSelect(
      getInputByLabel(shadowRoot, 'Class target') as InstanceType<typeof window.HTMLSelectElement>,
      'src/styles.css::framed'
    );

    expect(shadowRoot.querySelector('[data-property-id="backgroundColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="padding"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="borderStyle"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="borderWidth"]')).not.toBeNull();
    expect((getControl(shadowRoot, 'backgroundColor') as InstanceType<typeof window.HTMLInputElement>).value).toBe('');
    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe('12');
    expect((getControl(shadowRoot, 'borderStyle') as InstanceType<typeof window.HTMLSelectElement>).value).toBe('solid');

    const detachButton = shadowRoot.querySelector(
      '[data-hawk-eye-ui="class-target-detach-button"]'
    );

    if (!(detachButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing detach button');
    }

    click(detachButton);

    expect(shadowRoot.querySelector('[data-property-id="backgroundColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="padding"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-property-id="borderStyle"]')).not.toBeNull();
    expect((getControl(shadowRoot, 'backgroundColor') as InstanceType<typeof window.HTMLInputElement>).value).toBe('');
    expect((getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>).value).toBe('16');

    cleanup();
  });

  it('detaches from a semantic class target and keeps later edits local to the selected element', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const style = document.createElement('style');
    style.textContent = '.dense { padding-top: 16px; }';
    document.head.append(style);

    const target = document.createElement('button');
    target.className = 'dense';
    applyBaselineStyles(target, 'demo/src/App.tsx:52:7');
    mockRect(target, { height: 44, left: 36, top: 72, width: 148 });

    const peer = document.createElement('button');
    peer.className = 'dense';
    applyBaselineStyles(peer, 'demo/src/App.tsx:53:7');
    mockRect(peer, { height: 44, left: 196, top: 72, width: 148 });

    document.body.append(target, peer);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:52:7',
        file: 'demo/src/App.tsx',
        line: 52,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:52:7',
          mode: 'unknown',
          classNames: ['dense'],
          classTargets: [
            createClassTarget({
              id: 'src/styles.css::dense',
              className: 'dense',
              file: 'src/styles.css',
              line: 1,
              column: 1,
              selector: '.dense',
              fingerprint: 'dense-fp',
            }),
          ],
          fingerprint: 'fp-52-7',
        })
      );
    });

    const detachButton = shadowRoot.querySelector('[data-hawk-eye-ui="class-target-detach-button"]');

    if (!(detachButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing detach button');
    }

    click(detachButton);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="class-target-bar"]')).toBeNull();
    expect(shadowRoot.querySelector('[aria-label="Class target"]')).toBeNull();
    expect(
      document.head.querySelector('[data-hawk-eye-ui="class-target-preview-style"]')?.textContent
    ).toBe('');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '28px'
    );

    expect(target.style.paddingTop).toBe('28px');
    expect(window.getComputedStyle(peer).paddingTop).toBe('16px');

    cleanup();
    style.remove();
  });

  it('hides the authored class target dropdown for dynamic className selections', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('button');
    applyBaselineStyles(target, 'demo/src/App.tsx:61:7');
    mockRect(target, { height: 44, left: 36, top: 72, width: 148 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:61:7',
        file: 'demo/src/App.tsx',
        line: 61,
        column: 7,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:61:7',
          mode: 'unknown',
          classAttributeState: 'dynamic',
          classTargets: [],
          fingerprint: 'fp-61-7',
        })
      );
    });

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="class-target-bar"]')).toBeNull();
    cleanup();
  });

  it('applies dirty drafts to source only after clicking Apply Edits and keeps the selection active after a successful write', () => {
    vi.useFakeTimers();
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:52:11');
    mockRect(target, { height: 52, left: 28, top: 56, width: 164 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:52:11',
        file: 'demo/src/App.tsx',
        line: 52,
        column: 11,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:52:11',
          mode: 'tailwind',
          classNames: ['pt-4'],
          fingerprint: 'fp-52-11',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    expect(target.style.paddingTop).toBe('24px');
    expect(hot.send.mock.calls.filter(([event]) => event === HAWK_EYE_SAVE_EVENT)).toHaveLength(0);

    click(getFooterButton(shadowRoot, 'footer-changes-btn'));
    const applyButton = getFooterApplyButton(shadowRoot);
    expect(applyButton.textContent).toContain('Apply Edits');

    setElementFromPoint(host);
    click(applyButton);

    expectHotSendWithPayload(hot, HAWK_EYE_SAVE_EVENT, {
      capability: SAVE_CAPABILITY,
      mutations: [
        {
          file: 'demo/src/App.tsx',
          line: 52,
          column: 11,
          detached: false,
          fingerprint: 'fp-52-11',
          sourceLocation: {
            file: 'demo/src/App.tsx',
            line: 52,
            column: 11,
          },
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '16px',
              newValue: '24px',
            },
          ],
        },
      ],
    });

    expect(shadowRoot.textContent).toContain('Syncing source…');

    act(() => {
      hot.emit('hawk-eye:save-result', {
        success: true,
        modifiedFiles: ['demo/src/App.tsx'],
        warnings: [],
      });
    });

    expect(target.style.paddingTop).toBe('24px');
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer-status"]')?.getAttribute(
        'data-state'
      )
    ).toBe('transitioning');
    const status = shadowRoot.querySelector(
      '[data-hawk-eye-ui="footer-status"][data-presence="entering"]'
    );

    if (!(status instanceof window.HTMLParagraphElement)) {
      throw new Error('Missing footer status');
    }

    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Updated demo/src/App.tsx.');
    expect(shadowRoot.textContent).not.toContain('No element selected');

    advanceMotion(STATUS_TRANSITION_DURATION_MS);

    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer-status"]')?.getAttribute(
        'data-state'
      )
    ).toBe('idle');
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="footer-status"][data-presence="current"]')
        ?.textContent
    ).toContain('Updated demo/src/App.tsx.');
    cleanup();
  });

  it('re-requests style analysis and retries the save once after an invalid capability warning', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:64:11');
    mockRect(target, { height: 52, left: 28, top: 56, width: 164 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:64:11',
        file: 'demo/src/App.tsx',
        line: 64,
        column: 11,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:64:11',
          mode: 'tailwind',
          classNames: ['pt-4'],
          fingerprint: 'fp-64-11',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    setElementFromPoint(host);
    click(getFooterButton(shadowRoot, 'footer-changes-btn'));
    click(getFooterApplyButton(shadowRoot));

    expect(hot.send.mock.calls.filter(([event]) => event === HAWK_EYE_SAVE_EVENT)).toHaveLength(1);

    act(() => {
      hot.emit('hawk-eye:save-result', {
        success: false,
        error: 'Write aborted because the current client is not authorized to edit source files.',
        warnings: [
          {
            code: 'invalid-capability',
            file: '',
            line: 0,
            column: 0,
            message:
              'The save capability was missing, stale, or did not belong to the current client session.',
          },
        ],
      });
    });

    expectHotSendWithPayload(hot, HAWK_EYE_ANALYZE_STYLE_EVENT, {
      source: 'demo/src/App.tsx:64:11',
    });

    act(() => {
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:64:11',
          mode: 'tailwind',
          classNames: ['pt-4'],
          fingerprint: 'fp-64-11',
          saveCapability: 'fresh-save-capability',
        })
      );
    });

    const saveCalls = hot.send.mock.calls.filter(([event]) => event === HAWK_EYE_SAVE_EVENT);

    expect(saveCalls).toHaveLength(2);
    expect(saveCalls[1]?.[1]).toEqual(
      expect.objectContaining({
        capability: 'fresh-save-capability',
        clientId: expect.any(String),
      })
    );

    act(() => {
      hot.emit('hawk-eye:save-result', {
        success: true,
        modifiedFiles: ['demo/src/App.tsx'],
        warnings: [],
      });
    });

    expect(shadowRoot.textContent).toContain('Updated demo/src/App.tsx.');
    cleanup();
  });

  it('refreshes the selected draft source token after a save so later writes use the new JSX coordinates', async () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:52:11');
    mockRect(target, { height: 52, left: 28, top: 56, width: 164 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:52:11',
        file: 'demo/src/App.tsx',
        line: 52,
        column: 11,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:52:11',
          mode: 'tailwind',
          classNames: ['pt-4'],
          fingerprint: 'fp-52-11',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    setElementFromPoint(host);
    click(getFooterButton(shadowRoot, 'footer-changes-btn'));
    click(getFooterApplyButton(shadowRoot));

    act(() => {
      hot.emit('hawk-eye:save-result', {
        success: true,
        modifiedFiles: ['demo/src/App.tsx'],
        warnings: [],
      });
    });

    await act(async () => {
      target.setAttribute(HAWK_EYE_SOURCE_ATTRIBUTE, 'demo/src/App.tsx:105:13');
      await Promise.resolve();
      await Promise.resolve();
    });

    expectHotSendWithPayload(hot, HAWK_EYE_INSPECT_EVENT, {
      source: 'demo/src/App.tsx:105:13',
    });
    expectHotSendWithPayload(hot, HAWK_EYE_ANALYZE_STYLE_EVENT, {
      source: 'demo/src/App.tsx:105:13',
    });

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:105:13',
        file: 'demo/src/App.tsx',
        line: 105,
        column: 13,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:105:13',
          mode: 'tailwind',
          classNames: ['pt-6'],
          fingerprint: 'fp-105-13',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '30px'
    );

    setElementFromPoint(host);
    click(getFooterButton(shadowRoot, 'footer-changes-btn'));
    click(getFooterApplyButton(shadowRoot));

    expectHotSendWithPayload(hot, HAWK_EYE_SAVE_EVENT, {
      capability: SAVE_CAPABILITY,
      mutations: [
        {
          file: 'demo/src/App.tsx',
          line: 105,
          column: 13,
          detached: false,
          fingerprint: 'fp-105-13',
          sourceLocation: {
            file: 'demo/src/App.tsx',
            line: 105,
            column: 13,
          },
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '24px',
              newValue: '30px',
            },
          ],
        },
      ],
    });

    cleanup();
  });

  it('shows an inline-fallback hint for dynamic className selections and keeps Update Design enabled', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:60:11');
    mockRect(target, { height: 52, left: 28, top: 56, width: 164 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:60:11',
        file: 'demo/src/App.tsx',
        line: 60,
        column: 11,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:60:11',
          mode: 'unknown',
          classAttributeState: 'dynamic',
          styleAttributeState: 'missing',
          fingerprint: 'fp-60-11',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    expect(shadowRoot.textContent).toContain(
      'Dynamic className: edits will be written to inline styles.'
    );
    click(getFooterButton(shadowRoot, 'footer-changes-btn'));
    expect(getFooterApplyButton(shadowRoot).disabled).toBe(false);
    cleanup();
  });

  it('shows a style-wrap hint for dynamic className selections and keeps Update Design enabled', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:68:11');
    mockRect(target, { height: 52, left: 28, top: 56, width: 164 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:68:11',
        file: 'demo/src/App.tsx',
        line: 68,
        column: 11,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:68:11',
          mode: 'unknown',
          classAttributeState: 'dynamic',
          styleAttributeState: 'expression',
          fingerprint: 'fp-68-11',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    expect(shadowRoot.textContent).toContain(
      'Dynamic className + dynamic style: edits will be persisted by wrapping the style prop.'
    );
    click(getFooterButton(shadowRoot, 'footer-changes-btn'));
    const applyButton = getFooterApplyButton(shadowRoot);
    expect(applyButton.disabled).toBe(false);

    setElementFromPoint(host);
    click(applyButton);

    expectHotSendWithPayload(hot, HAWK_EYE_SAVE_EVENT, {
      capability: SAVE_CAPABILITY,
      mutations: [
        {
          file: 'demo/src/App.tsx',
          line: 68,
          column: 11,
          detached: false,
          fingerprint: 'fp-68-11',
          sourceLocation: {
            file: 'demo/src/App.tsx',
            line: 68,
            column: 11,
          },
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '16px',
              newValue: '24px',
            },
          ],
        },
      ],
    });

    act(() => {
      hot.emit('hawk-eye:save-result', {
        success: true,
        modifiedFiles: ['demo/src/App.tsx'],
        warnings: [],
      });
    });

    expect(shadowRoot.textContent).toContain('Updated demo/src/App.tsx.');
    cleanup();
  });

  it('supports unit-aware focused number controls and keeps invalid text visible without replacing the last valid preview', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:8:7');
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;
    const fontSizeInput = () => getControl(shadowRoot, 'fontSize');
    const fontSizeUnit = () => getControl(shadowRoot, 'fontSize-unit');

    click(trigger);
    click(document);

    updateSelect(fontSizeUnit() as InstanceType<typeof window.HTMLSelectElement>, 'rem');
    updateInput(fontSizeInput() as InstanceType<typeof window.HTMLInputElement>, '1.5');
    expect(target.style.fontSize).toBe('1.5rem');
    expect(fontSizeInput().value).toBe('1.5');

    updateInput(fontSizeInput() as InstanceType<typeof window.HTMLInputElement>, '1.');
    pressInputKey(fontSizeInput() as InstanceType<typeof window.HTMLInputElement>, 'ArrowUp');
    expect(target.style.fontSize).toBe('2rem');
    expect(fontSizeInput().value).toBe('2');

    updateInput(fontSizeInput() as InstanceType<typeof window.HTMLInputElement>, 'banana');
    expect(target.style.fontSize).toBe('2rem');
    expect(fontSizeInput().value).toBe('banana');
    // compact card marks invalid state via data-invalid attribute; no inline text in new panel
    expect(
      shadowRoot
        .querySelector('[data-hawk-eye-control="fontSize"]')
        ?.closest('[data-invalid="true"]')
    ).not.toBeNull();
    cleanup();
  });

  it('supports opposite-side and per-side padding editing with side-level resets', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:18:9');
    target.style.paddingTop = '16px';
    target.style.paddingRight = '16px';
    target.style.paddingBottom = '16px';
    target.style.paddingLeft = '16px';
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;
    const paddingToggle = () =>
      shadowRoot.querySelector<HTMLButtonElement>(
        '[data-property-id="padding"] [data-hawk-eye-ui="link-toggle-btn"]'
      );

    click(trigger);
    click(document);

    updateInput(
      getInputByLabel(shadowRoot, 'Padding vertical sides') as InstanceType<
        typeof window.HTMLInputElement
      >,
      '20'
    );
    expect(target.style.paddingTop).toBe('20px');
    expect(target.style.paddingBottom).toBe('20px');
    expect(target.style.paddingRight).toBe('16px');
    expect(target.style.paddingLeft).toBe('16px');

    updateInput(
      getInputByLabel(shadowRoot, 'Padding horizontal sides') as InstanceType<
        typeof window.HTMLInputElement
      >,
      '24'
    );
    expect(target.style.paddingRight).toBe('24px');
    expect(target.style.paddingLeft).toBe('24px');
    expect(target.style.paddingTop).toBe('20px');
    expect(target.style.paddingBottom).toBe('20px');

    updateInput(
      getControl(shadowRoot, 'marginTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );
    expect(target.style.marginTop).toBe('24px');
    expect(target.style.marginRight).toBe('4px');

    click(paddingToggle() as InstanceType<typeof window.HTMLButtonElement>);
    updateInput(
      getInputByLabel(shadowRoot, 'Padding top') as InstanceType<typeof window.HTMLInputElement>,
      '20px'
    );
    expect(target.style.paddingTop).toBe('20px');
    expect(target.style.paddingRight).toBe('24px');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '26px'
    );

    expect(target.style.paddingTop).toBe('26px');
    expect(target.style.paddingRight).toBe('24px');
    expect(target.style.paddingBottom).toBe('20px');
    expect(target.style.paddingLeft).toBe('24px');
    cleanup();
  });

  it('supports per-field reset and resetting all preview changes', () => {
    const confirm = vi.spyOn(window, 'confirm');
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:11:5');
    mockRect(target, { height: 56, left: 24, top: 40, width: 140 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );
    updateInput(
      getControl(shadowRoot, 'fontSize') as InstanceType<typeof window.HTMLInputElement>,
      '20'
    );

    const fontSizeCard = shadowRoot.querySelector('[data-property-id="fontSize"]');

    if (!(fontSizeCard instanceof window.HTMLElement)) {
      throw new Error('Missing fontSize card');
    }

    const fontSizeReset = fontSizeCard.querySelector('[data-hawk-eye-ui="control-reset-mini"]');

    if (!(fontSizeReset instanceof window.HTMLButtonElement)) {
      throw new Error('Missing fontSize reset button');
    }

    setElementFromPoint(host);
    click(fontSizeReset);

    expect(target.style.paddingTop).toBe('24px');
    expect(target.style.fontSize).toBe('18px');
    expect(getControl(shadowRoot, 'fontSize').value).toBe('18');
    expect(
      shadowRoot
        .querySelector('[data-property-id="fontSize"]')
        ?.querySelector('[data-hawk-eye-ui="control-reset-mini"]')
    ).toBeNull();

    const resetAll = shadowRoot.querySelector('[data-hawk-eye-ui="footer-revert-btn"]');

    if (!(resetAll instanceof window.HTMLButtonElement)) {
      throw new Error('Missing reset all button');
    }

    confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);

    setElementFromPoint(host);
    click(resetAll);

    expect(confirm).toHaveBeenCalledWith('Revert all unsaved changes?');
    expect(target.style.paddingTop).toBe('24px');
    expect(target.style.fontSize).toBe('18px');
    expect(resetAll.disabled).toBe(false);

    setElementFromPoint(host);
    click(resetAll);

    expect(target.style.paddingTop).toBe('16px');
    expect(target.style.fontSize).toBe('18px');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="footer-revert-btn"]')).toBeNull();
    cleanup();
  });

  it('registers a beforeunload guard only while preview changes are pending', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:18:9');
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const cleanEvent = dispatchBeforeUnload();
    expect(cleanEvent.defaultPrevented).toBe(false);
    expect(cleanEvent.returnValue).toBeUndefined();

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    const dirtyEvent = dispatchBeforeUnload();
    expect(dirtyEvent.defaultPrevented).toBe(true);
    expect(dirtyEvent.returnValue).toBe('');

    const resetAll = shadowRoot.querySelector('[data-hawk-eye-ui="footer-revert-btn"]');

    if (!(resetAll instanceof window.HTMLButtonElement)) {
      throw new Error('Missing reset all button');
    }

    setElementFromPoint(host);
    click(resetAll);
    expect(confirm).toHaveBeenCalledWith('Revert all unsaved changes?');

    const revertedEvent = dispatchBeforeUnload();
    expect(revertedEvent.defaultPrevented).toBe(false);
    expect(revertedEvent.returnValue).toBeUndefined();
    cleanup();
  });

  it('hides size mode controls even when the selected element has authored relative sizing', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:14:3');
    target.style.width = '100%';
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(target.style.width).toBe('100%');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width-mode"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height-mode"]')).toBeNull();
    cleanup();
  });

  it('keeps size and grid child span controls hidden in v1', () => {
    const flexParent = document.createElement('div');
    flexParent.style.display = 'flex';
    flexParent.style.flexDirection = 'row';
    document.body.append(flexParent);

    const flexChild = document.createElement('div');
    applyBaselineStyles(flexChild, 'demo/src/App.tsx:16:5');
    mockRect(flexChild, { height: 48, left: 24, top: 40, width: 120 });
    flexParent.append(flexChild);

    const gridParent = document.createElement('div');
    gridParent.style.display = 'grid';
    gridParent.style.gridTemplateColumns = 'repeat(2, 1fr)';
    document.body.append(gridParent);

    const gridChild = document.createElement('div');
    applyBaselineStyles(gridChild, 'demo/src/App.tsx:18:5');
    gridChild.style.display = 'grid';
    gridChild.style.gridTemplateColumns = 'repeat(2, 1fr)';
    gridChild.style.gridTemplateRows = 'fit-content(72px) fit-content(72px)';
    mockRect(gridChild, { height: 48, left: 200, top: 40, width: 120 });
    gridParent.append(gridChild);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);

    setElementFromPoint(flexChild);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="flexGrow"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="flexShrink"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="flexBasis"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="alignSelf"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width-mode"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height-mode"]')).toBeNull();

    setElementFromPoint(gridChild);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="columnSpan"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="rowSpan"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="alignSelf"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width-mode"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height-mode"]')).toBeNull();
    cleanup();
  });

  it('hides width, height, and aspect ratio controls in the v1 inspector', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:72:9');
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width-mode"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height-mode"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="aspect-ratio-lock-button"]')).toBeNull();
    cleanup();
  });

  it('preserves preview drafts across selections and restores them when reselected', () => {
    vi.useFakeTimers();
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
    const paddingInput = () => getControl(shadowRoot, 'paddingTop');
    const marginInput = () => getControl(shadowRoot, 'marginTop');

    click(trigger);

    setElementFromPoint(first);
    click(document);
    updateInput(paddingInput() as InstanceType<typeof window.HTMLInputElement>, '24');

    setElementFromPoint(second);
    click(document);
    updateInput(marginInput() as InstanceType<typeof window.HTMLInputElement>, '12');

    expect(first.style.paddingTop).toBe('24px');
    expect(second.style.marginTop).toBe('12px');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel-source"]')).toBeNull();
    const changesButton = shadowRoot.querySelector(
      '[data-hawk-eye-ui="footer-changes-btn"]'
    ) as InstanceType<typeof window.HTMLButtonElement> | null;
    expect(changesButton?.textContent).toContain('View Edits');

    click(changesButton as Element);
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="view-stack"]')?.getAttribute('data-state')
    ).toBe('to-changes');
    expect(
      shadowRoot.querySelector(
        '[data-hawk-eye-ui="panel-view"][data-view="changes"][data-presence="entering"]'
      )
    ).not.toBeNull();

    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="view-stack"]')?.getAttribute('data-state')
    ).toBe('idle');
    expect(shadowRoot.textContent).toContain('Changes Done');

    const changesCards = Array.from(
      shadowRoot.querySelectorAll('[data-hawk-eye-ui="changes-card"]')
    );
    expect(changesCards).toHaveLength(2);
    const firstDraftCard = changesCards.find((card) => card.textContent?.includes('App.tsx:20'));

    if (!firstDraftCard) {
      throw new Error('Missing first draft card');
    }

    click(firstDraftCard);
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="view-stack"]')?.getAttribute('data-state')
    ).toBe('to-properties');

    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(paddingInput().value).toBe('24');
    cleanup();
  });

  it('restores the Layers tab, keeps it active during layer selection, and does not auto-return to Properties', () => {
    vi.useFakeTimers();

    const parent = document.createElement('section');
    applyBaselineStyles(parent, 'demo/src/App.tsx:18:3');
    parent.setAttribute('aria-label', 'Hero section');
    mockRect(parent, { height: 120, left: 24, top: 40, width: 280 });

    const child = document.createElement('button');
    applyBaselineStyles(child, 'demo/src/App.tsx:19:5');
    child.setAttribute('aria-label', 'Hero CTA');
    child.style.paddingTop = '6px';
    mockRect(child, { height: 44, left: 40, top: 88, width: 132 });

    parent.append(child);
    document.body.append(parent);
    setElementFromPoint(parent);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(getPanelTab(shadowRoot, 'properties').getAttribute('data-active')).toBe('true');
    expect(getPanelTab(shadowRoot, 'layers').getAttribute('data-active')).toBe('false');

    click(getPanelTab(shadowRoot, 'layers'));

    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="view-stack"]')?.getAttribute('data-state')
    ).toBe('to-layers');

    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(getPanelTab(shadowRoot, 'layers').getAttribute('data-active')).toBe('true');
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-view"][data-view="layers"][data-presence="current"]')
    ).not.toBeNull();
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-ui="layer-select-btn"]')).toHaveLength(2);

    const childLayerButton = shadowRoot.querySelector(
      '[aria-label="Select layer Hero CTA"]'
    );

    if (!(childLayerButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing child layer button');
    }

    click(childLayerButton);

    expect(getPanelTab(shadowRoot, 'layers').getAttribute('data-active')).toBe('true');
    expect(
      shadowRoot.querySelector(
        '[data-hawk-eye-ui="layer-select-btn"][aria-label="Select layer Hero CTA"][aria-pressed="true"]'
      )
    ).not.toBeNull();

    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(getPanelTab(shadowRoot, 'layers').getAttribute('data-active')).toBe('true');
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-view"][data-view="layers"][data-presence="current"]')
    ).not.toBeNull();
    cleanup();
  });

  it('updates the selected instance when multiple elements share the same source token', () => {
    const sharedSource = 'demo/src/App.tsx:72:9';

    const first = document.createElement('div');
    applyBaselineStyles(first, sharedSource);
    first.style.paddingTop = '8px';
    mockRect(first, { height: 44, left: 24, top: 40, width: 132 });
    document.body.append(first);

    const second = document.createElement('div');
    applyBaselineStyles(second, sharedSource);
    second.style.paddingTop = '16px';
    mockRect(second, { height: 44, left: 220, top: 40, width: 132 });
    document.body.append(second);

    setElementFromPoint(second);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(getControl(shadowRoot, 'paddingTop').value).toBe('16');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '28'
    );

    expect(second.style.paddingTop).toBe('28px');
    expect(first.style.paddingTop).toBe('8px');
    cleanup();
  });

  it('shows the dedicated footer in Changes with icon-label buttons and tooltips', () => {
    vi.useFakeTimers();

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:64:7');
    target.setAttribute('aria-label', 'Layered card');
    mockRect(target, { height: 44, left: 24, top: 40, width: 132 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24'
    );

    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer"]')?.getAttribute('data-view')
    ).toBe('properties');

    click(getPanelTab(shadowRoot, 'layers'));
    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer"]')).toBeNull();

    click(getPanelTab(shadowRoot, 'properties'));
    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer"]')?.getAttribute('data-view')
    ).toBe('properties');
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="footer-preview-toggle-btn"]')?.getAttribute('title')
    ).toBe('Hide edits preview');
    expect(getFooterButton(shadowRoot, 'footer-revert-btn').getAttribute('title')).toBe(
      'Revert unsaved changes'
    );
    expect(
      getFooterButton(shadowRoot, 'footer-preview-toggle-btn').getAttribute('data-variant')
    ).toBe('compact');
    expect(getFooterButton(shadowRoot, 'footer-revert-btn').getAttribute('data-variant')).toBe(
      'compact'
    );
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="footer-apply-btn"]')).toBeNull();

    const changesButton = shadowRoot.querySelector(
      '[data-hawk-eye-ui="footer-changes-btn"]'
    );

    if (!(changesButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing changes footer button');
    }

    expect(changesButton.textContent).toContain('View Edits');

    click(changesButton);
    advanceMotion(VIEW_TRANSITION_DURATION_MS);

    expect(shadowRoot.textContent).toContain('Changes Done');
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer"]')?.getAttribute('data-view')
    ).toBe('changes');

    const backButton = getFooterButton(shadowRoot, 'footer-back-btn');
    const applyButton = getFooterButton(shadowRoot, 'footer-apply-btn');
    const hideButton = getFooterButton(shadowRoot, 'footer-hide-btn');
    const resetButton = getFooterButton(shadowRoot, 'footer-revert-btn');

    expect(backButton.getAttribute('title')).toBe('Back to properties');
    expect(applyButton.getAttribute('title')).toBe('Apply edits');
    expect(hideButton.getAttribute('title')).toBe('Hide edits preview');
    expect(resetButton.getAttribute('title')).toBe('Reset unsaved changes');
    expect(backButton.getAttribute('data-tone')).toBe('secondary');
    expect(applyButton.getAttribute('data-tone')).toBe('primary');
    expect(hideButton.getAttribute('data-tone')).toBe('secondary');
    expect(resetButton.getAttribute('data-tone')).toBe('secondary');
    expect(backButton.getAttribute('data-variant')).toBe('compact');
    expect(applyButton.getAttribute('data-variant')).toBe('labelled');
    expect(hideButton.getAttribute('data-variant')).toBe('compact');
    expect(resetButton.getAttribute('data-variant')).toBe('compact');
    expect(backButton.querySelector('[data-hawk-eye-ui="footer-action-icon-shell"]')).not.toBeNull();
    expect(applyButton.querySelector('[data-hawk-eye-ui="footer-action-icon-shell"]')).toBeNull();
    expect(hideButton.querySelector('[data-hawk-eye-ui="footer-action-icon-shell"]')).not.toBeNull();
    expect(resetButton.querySelector('[data-hawk-eye-ui="footer-action-icon-shell"]')).not.toBeNull();
    expect(backButton.querySelector('[data-hawk-eye-ui="footer-action-icon"] svg')).not.toBeNull();
    expect(applyButton.querySelector('[data-hawk-eye-ui="footer-action-icon"]')).toBeNull();
    expect(hideButton.querySelector('[data-hawk-eye-ui="footer-action-icon"]')).not.toBeNull();
    expect(resetButton.querySelector('[data-hawk-eye-ui="footer-action-icon"]')).not.toBeNull();
    expect((hideButton.querySelector('img') as HTMLImageElement | null)?.src).toContain('Style=');
    expect((resetButton.querySelector('img') as HTMLImageElement | null)?.src).toContain(
      'Style=inactive'
    );
    expect(backButton.querySelector('[data-hawk-eye-ui="footer-action-label"]')).toBeNull();
    expect(applyButton.querySelector('[data-hawk-eye-ui="footer-action-label"]')?.textContent).toBe(
      'Apply Edits'
    );
    expect(hideButton.querySelector('[data-hawk-eye-ui="footer-action-label"]')).toBeNull();
    expect(resetButton.querySelector('[data-hawk-eye-ui="footer-action-label"]')).toBeNull();
    expect(backButton.querySelector('[data-hawk-eye-ui="sr-only"]')?.textContent).toBe('Back');
    expect(hideButton.querySelector('[data-hawk-eye-ui="sr-only"]')?.textContent).toBe('Hide');
    expect(resetButton.querySelector('[data-hawk-eye-ui="sr-only"]')?.textContent).toBe('Reset');

    click(backButton);
    advanceMotion(VIEW_TRANSITION_DURATION_MS);
    expect(
      shadowRoot.querySelector('[data-hawk-eye-ui="panel-footer"]')?.getAttribute('data-view')
    ).toBe('properties');
    cleanup();
  });

  it('blocks closing while a source write is still in flight', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:14:3');
    mockRect(target, { height: 44, left: 24, top: 40, width: 132 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    act(() => {
      hot.emit('hawk-eye:selection', {
        source: 'demo/src/App.tsx:14:3',
        file: 'demo/src/App.tsx',
        line: 14,
        column: 3,
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
      hot.emit(
        'hawk-eye:style-analysis',
        createStyleAnalysisPayload({
          source: 'demo/src/App.tsx:14:3',
          mode: 'tailwind',
          classNames: ['pt-4'],
          fingerprint: 'fp-14-3',
        })
      );
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '28px'
    );

    expect(target.style.paddingTop).toBe('28px');
    pressEscape();

    expect(shadowRoot.textContent).toContain(
      'Apply or revert changes before closing the inspector.'
    );
    expect(shadowRoot.textContent).toContain('Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).not.toBeNull();
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

  it('keeps the inspector shell scrollable for the taller CraftKit editor frame', () => {
    const { cleanup, shadowRoot } = renderDesignTool();
    const styleText = shadowRoot.querySelector('style')?.textContent ?? '';

    expect(styleText).toMatch(
      /\[data-hawk-eye-ui="panel-body"\]\s*\{[^}]*min-height:\s*0;/s
    );
    expect(styleText).toMatch(
      /\[data-hawk-eye-ui="view-stack"\]\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*0;|\[data-hawk-eye-ui="view-stack"\]\s*\{[^}]*min-height:\s*0;[^}]*height:\s*100%;/s
    );
    expect(styleText).toMatch(
      /\[data-hawk-eye-ui="panel-view"\]\s*\{[^}]*height:\s*100%;/s
    );
    expect(styleText).toMatch(
      /\[data-hawk-eye-ui="outline"\]\s*\{[^}]*background:\s*transparent;/s
    );
    expect(styleText).not.toMatch(
      /\[data-hawk-eye-ui="outline"\]\s*\{[^}]*0 0 0 9999px/s
    );

    cleanup();
  });

  it('supports focused fill, typography, appearance, and border controls', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:44:11');
    target.style.borderStyle = 'solid';
    target.style.borderWidth = '1px';
    mockRect(target, { height: 44, left: 24, top: 40, width: 132 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateInput(
      getControl(shadowRoot, 'backgroundColor') as InstanceType<typeof window.HTMLInputElement>,
      '#112233'
    );
    updateSelect(
      getControl(shadowRoot, 'fontWeight') as InstanceType<typeof window.HTMLSelectElement>,
      '700'
    );
    expect(shadowRoot.querySelector('[data-property-id="display"]')).toBeNull();
    updateInput(
      getControl(shadowRoot, 'fontSize') as InstanceType<typeof window.HTMLInputElement>,
      '24'
    );
    updateInput(
      getControl(shadowRoot, 'opacity') as InstanceType<typeof window.HTMLInputElement>,
      '64'
    );
    updateInput(
      getControl(shadowRoot, 'color') as InstanceType<typeof window.HTMLInputElement>,
      '#778899'
    );
    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'textAlign-center'));
    updateInput(
      getInputByLabel(shadowRoot, 'Corner Radius all sides') as InstanceType<
        typeof window.HTMLInputElement
      >,
      '22'
    );
    updateInput(
      getControl(shadowRoot, 'borderColor') as InstanceType<typeof window.HTMLInputElement>,
      '#445566'
    );
    updateInput(
      getInputByLabel(shadowRoot, 'Stroke Weight all sides') as InstanceType<
        typeof window.HTMLInputElement
      >,
      '2'
    );

    expect(target.style.backgroundColor).toBe('rgb(17, 34, 51)');
    expect(target.style.color).toBe('rgb(119, 136, 153)');
    expect(target.style.fontWeight).toBe('700');
    expect(target.style.fontSize).toBe('24px');
    expect(getControl(shadowRoot, 'opacity').value).toBe('64');
    expect(target.style.opacity).toBe('0.64');
    expect(target.style.textAlign).toBe('center');
    expect(target.style.borderTopLeftRadius).toBe('22px');
    expect(target.style.borderColor).toBe('rgb(68, 85, 102)');
    expect(target.style.borderTopWidth).toBe('2px');
    cleanup();
  });

  it('hides the appearance fill colour control for gradient and image fills', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:52:7');
    target.style.backgroundImage = 'linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))';
    mockRect(target, { height: 64, left: 24, top: 40, width: 180 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-property-id="backgroundColor"]')).toBeNull();

    target.style.backgroundImage = "url('./hero.png')";
    click(document);

    expect(shadowRoot.querySelector('[data-property-id="backgroundColor"]')).toBeNull();
    cleanup();
  });

  it('hides border-dependent controls when the border style is none', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:60:9');
    target.style.borderStyle = 'none';
    target.style.borderTopWidth = '0px';
    target.style.borderRightWidth = '0px';
    target.style.borderBottomWidth = '0px';
    target.style.borderLeftWidth = '0px';
    mockRect(target, { height: 56, left: 24, top: 40, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="borderStyle"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="borderColor"]')).toBeNull();
    expect(shadowRoot.querySelector('[aria-label="Stroke Weight all sides"]')).toBeNull();
    expect(shadowRoot.querySelector('[aria-label="Dash"]')).toBeNull();
    expect(shadowRoot.querySelector('[aria-label="Gap"]')).toBeNull();
    cleanup();
  });

  it('reveals border-dependent controls when switching to visible border styles', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:62:9');
    target.style.borderStyle = 'none';
    target.style.borderWidth = '0px';
    mockRect(target, { height: 56, left: 24, top: 40, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateSelect(
      getControl(shadowRoot, 'borderStyle') as InstanceType<typeof window.HTMLSelectElement>,
      'solid'
    );

    expect(shadowRoot.querySelector('[data-hawk-eye-control="borderColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[aria-label="Stroke Weight all sides"]')).not.toBeNull();
    expect(target.style.borderStyle).toBe('solid');
    expect(target.style.borderTopWidth).toBe('1px');
    cleanup();
  });

  it('applies grouped stroke-weight edits to all four sides when starting from a bottom-only border', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:64:9');
    target.style.borderTopWidth = '0px';
    target.style.borderRightWidth = '0px';
    target.style.borderBottomWidth = '3px';
    target.style.borderLeftWidth = '0px';
    target.style.borderColor = 'rgb(68, 85, 102)';
    mockRect(target, { height: 56, left: 24, top: 40, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const linkToggle = shadowRoot.querySelector(
      '[data-property-id="borderWidth"] [data-hawk-eye-ui="link-toggle-btn"]'
    );

    if (!(linkToggle instanceof window.HTMLButtonElement)) {
      throw new Error('Missing stroke-weight link toggle');
    }

    click(linkToggle);

    updateInput(
      getInputByLabel(shadowRoot, 'Stroke Weight all sides') as InstanceType<
        typeof window.HTMLInputElement
      >,
      '1'
    );

    expect(target.style.borderTopWidth).toBe('1px');
    expect(target.style.borderRightWidth).toBe('1px');
    expect(target.style.borderBottomWidth).toBe('1px');
    expect(target.style.borderLeftWidth).toBe('1px');
    cleanup();
  });

  it('normalizes grouped stroke-weight edits to the currently visible stroke color when only the bottom border has color', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:65:9');
    target.style.borderTopWidth = '0px';
    target.style.borderRightWidth = '0px';
    target.style.borderBottomWidth = '3px';
    target.style.borderLeftWidth = '0px';
    target.style.borderColor = '';
    target.style.borderTopColor = 'transparent';
    target.style.borderRightColor = 'transparent';
    target.style.borderBottomColor = 'rgb(68, 85, 102)';
    target.style.borderLeftColor = 'transparent';
    mockRect(target, { height: 56, left: 24, top: 40, width: 168 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const linkToggle = shadowRoot.querySelector(
      '[data-property-id="borderWidth"] [data-hawk-eye-ui="link-toggle-btn"]'
    );

    if (!(linkToggle instanceof window.HTMLButtonElement)) {
      throw new Error('Missing stroke-weight link toggle');
    }

    click(linkToggle);

    updateInput(
      getInputByLabel(shadowRoot, 'Stroke Weight all sides') as InstanceType<
        typeof window.HTMLInputElement
      >,
      '1'
    );

    expect(target.style.borderTopWidth).toBe('1px');
    expect(target.style.borderRightWidth).toBe('1px');
    expect(target.style.borderBottomWidth).toBe('1px');
    expect(target.style.borderLeftWidth).toBe('1px');
    expect(target.style.borderColor).toBe('rgb(68, 85, 102)');
    cleanup();
  });

  it('keeps non-focused controls out of the panel UI', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:57:13');
    mockRect(target, { height: 48, left: 24, top: 40, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    // True non-focused controls still absent
    expect(shadowRoot.querySelector('[data-hawk-eye-control="property-search"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="opacity"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="cursor"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="userSelect"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="overflow"]')).toBeNull();
    // segmented and select controls are present via their concrete control ids
    expect(shadowRoot.querySelector('[data-hawk-eye-control="fontFamily"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="mixBlendMode"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="borderTopWidth"]')).toBeNull();
    cleanup();
  });

  it('supports keyboard navigation for focused segmented controls', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:63:17');
    mockRect(target, { height: 52, left: 24, top: 40, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const textAlignLeft = getButtonControl(shadowRoot, 'textAlign-left');
    const panel = shadowRoot.querySelector('[data-hawk-eye-ui="panel"]');

    if (!(panel instanceof window.HTMLElement)) {
      throw new Error('Missing panel');
    }

    keyDown(textAlignLeft, 'ArrowRight');

    expect(target.style.textAlign).toBe('center');

    const initialPanelHeight = `${window.innerHeight - 64}px`;

    expect(panel.style.getPropertyValue('--hawk-eye-panel-width')).toBe('320px');
    expect(panel.style.getPropertyValue('--hawk-eye-panel-height')).toBe(initialPanelHeight);
    cleanup();
  });
});
