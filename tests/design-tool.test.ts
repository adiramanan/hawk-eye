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

  if (
    !(input instanceof window.HTMLInputElement) &&
    !(input instanceof window.HTMLSelectElement)
  ) {
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
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="spacing"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="fill-appearance"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="typography"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="size"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="layout-priority"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="stroke"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="effects"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="position"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="auto-layout"]')).toHaveLength(1);
    expect(shadowRoot.querySelector('[data-hawk-eye-section="fill"]')).toBeNull();
    expect(getControl(shadowRoot, 'paddingTop').value).toBe('16px');
    expect(getControl(shadowRoot, 'borderTopLeftRadius').value).toBe('14px');
    expect(getControl(shadowRoot, 'fontWeight').value).toBe('600');
    expect(getControl(shadowRoot, 'opacity-number').value).toBe('0.8');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="borderRadius"]')).toBeNull();
    cleanup();
  });

  it('supports unit-aware sizing controls and keeps invalid text visible without replacing the last valid preview', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:8:7');
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;
    const widthInput = () => getControl(shadowRoot, 'width');
    const widthUnit = () => getControl(shadowRoot, 'width-unit');

    click(trigger);
    click(document);

    updateSelect(widthUnit() as InstanceType<typeof window.HTMLSelectElement>, '%');
    updateInput(widthInput() as InstanceType<typeof window.HTMLInputElement>, '80');
    expect(target.style.width).toBe('80%');
    expect(shadowRoot.textContent).toContain('120px -> 80%');

    updateInput(widthInput() as InstanceType<typeof window.HTMLInputElement>, 'banana');
    expect(target.style.width).toBe('80%');
    expect(widthInput().value).toBe('banana');
    expect(shadowRoot.textContent).toContain('Invalid value. Preview stays at 80%.');

    updateSelect(widthUnit() as InstanceType<typeof window.HTMLSelectElement>, 'auto');
    expect(target.style.width).toBe('auto');
    expect((widthInput() as InstanceType<typeof window.HTMLInputElement>).disabled).toBe(true);
    cleanup();
  });

  it('supports linked and unlinked per-side editing with side-level resets', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:18:9');
    target.style.paddingTop = '16px';
    target.style.paddingRight = '16px';
    target.style.paddingBottom = '16px';
    target.style.paddingLeft = '16px';
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateInput(
      getControl(shadowRoot, 'marginTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );
    expect(target.style.marginTop).toBe('24px');
    expect(target.style.marginRight).toBe('4px');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '20px'
    );
    expect(target.style.paddingTop).toBe('20px');
    expect(target.style.paddingRight).toBe('20px');
    expect(target.style.paddingBottom).toBe('20px');
    expect(target.style.paddingLeft).toBe('20px');

    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'paddingTop-reset'));

    expect(target.style.paddingTop).toBe('16px');
    expect(target.style.paddingRight).toBe('20px');
    expect(target.style.paddingBottom).toBe('20px');
    expect(target.style.paddingLeft).toBe('20px');
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

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );
    updateInput(
      getControl(shadowRoot, 'opacity-number') as InstanceType<typeof window.HTMLInputElement>,
      '0.5'
    );

    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'paddingTop-reset'));

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
    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    setElementFromPoint(second);
    click(document);
    updateInput(
      getControl(shadowRoot, 'marginTop') as InstanceType<typeof window.HTMLInputElement>,
      '12px'
    );

    expect(first.style.paddingTop).toBe('24px');
    expect(second.style.marginTop).toBe('12px');
    expect(shadowRoot.textContent).toContain('demo/src/App.tsx:20:5');
    expect(shadowRoot.textContent).toContain('demo/src/App.tsx:38:9');

    setElementFromPoint(first);
    click(document);

    expect(getControl(shadowRoot, 'paddingTop').value).toBe('24px');
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

    expect(getControl(shadowRoot, 'paddingTop').value).toBe('16px');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '28px'
    );

    expect(second.style.paddingTop).toBe('28px');
    expect(first.style.paddingTop).toBe('8px');
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
    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '28px'
    );

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

  it('supports typography presets and combined layout controls', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:44:11');
    target.style.fontFamily = '"Avenir Next", sans-serif';
    mockRect(target, { height: 44, left: 24, top: 40, width: 132 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const fontFamily = getControl(
      shadowRoot,
      'fontFamily'
    ) as InstanceType<typeof window.HTMLSelectElement>;
    expect(fontFamily.value).toBe('"Avenir Next", sans-serif');

    updateSelect(fontFamily, 'Georgia, serif');
    updateSelect(
      getControl(shadowRoot, 'display') as InstanceType<typeof window.HTMLSelectElement>,
      'flex'
    );
    updateSelect(
      getControl(shadowRoot, 'positionType') as InstanceType<typeof window.HTMLSelectElement>,
      'absolute'
    );
    updateSelect(
      getControl(shadowRoot, 'overflow') as InstanceType<typeof window.HTMLSelectElement>,
      'hidden'
    );
    updateInput(
      getControl(shadowRoot, 'zIndex') as InstanceType<typeof window.HTMLInputElement>,
      '12'
    );

    expect(target.style.fontFamily).toContain('Georgia');
    expect(target.style.display).toBe('flex');
    expect(target.style.position).toBe('absolute');
    expect(target.style.overflow).toBe('hidden');
    expect(target.style.zIndex).toBe('12');
    cleanup();
  });

  it('filters controls with property search and reveals matching fallback groups', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:57:13');
    mockRect(target, { height: 48, left: 24, top: 40, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    expect(shadowRoot.querySelector('[data-hawk-eye-control="cursor"]')).toBeNull();

    updateInput(
      getControl(shadowRoot, 'property-search') as InstanceType<typeof window.HTMLInputElement>,
      'cursor'
    );

    expect(getControl(shadowRoot, 'cursor')).toBeInstanceOf(window.HTMLSelectElement);
    expect(shadowRoot.querySelector('[data-hawk-eye-control="fontWeight"]')).toBeNull();
    expect(shadowRoot.textContent).toContain('1 matching properties');
    cleanup();
  });

  it('supports keyboard navigation for grouped controls and the panel resize handle', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:63:17');
    mockRect(target, { height: 52, left: 24, top: 40, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const visibilityVisible = getButtonControl(shadowRoot, 'visibility-visible');
    const flexDirectionRow = getButtonControl(shadowRoot, 'flexDirection-row');
    const resizeHandle = getButtonControl(shadowRoot, 'panel-resize');
    const panel = shadowRoot.querySelector('[data-hawk-eye-ui="panel"]');

    if (!(panel instanceof window.HTMLElement)) {
      throw new Error('Missing panel');
    }

    keyDown(visibilityVisible, 'ArrowRight');
    keyDown(flexDirectionRow, 'ArrowRight');

    expect(target.style.visibility).toBe('hidden');
    expect(target.style.display).toBe('flex');
    expect(target.style.flexDirection).toBe('column');

    expect(panel.style.getPropertyValue('--hawk-eye-panel-width')).toBe('420px');
    expect(panel.style.getPropertyValue('--hawk-eye-panel-height')).toBe('760px');

    keyDown(resizeHandle, 'ArrowLeft');
    keyDown(resizeHandle, 'ArrowUp');

    expect(panel.style.getPropertyValue('--hawk-eye-panel-width')).toBe('444px');
    expect(panel.style.getPropertyValue('--hawk-eye-panel-height')).toBe('648px');
    cleanup();
  });

  it('promotes block elements to flex while auto-layout container controls are dirty', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:68:21');
    mockRect(target, { height: 52, left: 24, top: 40, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'flexDirection-column'));

    expect(target.style.display).toBe('flex');
    expect(target.style.flexDirection).toBe('column');

    setElementFromPoint(host);
    const resetAll = shadowRoot.querySelector('[data-hawk-eye-ui="secondary-button"]');

    if (!(resetAll instanceof window.HTMLButtonElement)) {
      throw new Error('Missing reset all button');
    }

    click(resetAll);

    expect(target.style.display).toBe('block');
    expect(target.style.flexDirection).toBe('row');
    cleanup();
  });

  it('supports advanced stroke, effects, position, and auto-layout controls', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:61:17');
    mockRect(target, { height: 52, left: 24, top: 40, width: 144 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    updateInput(
      getControl(shadowRoot, 'borderTopWidth') as InstanceType<typeof window.HTMLInputElement>,
      '3px'
    );
    expect(target.style.borderTopWidth).toBe('3px');
    expect(target.style.borderRightWidth).toBe('3px');
    expect(target.style.borderBottomWidth).toBe('3px');
    expect(target.style.borderLeftWidth).toBe('3px');

    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'borderTopWidth-reset'));
    expect(target.style.borderTopWidth).toBe('1px');
    expect(target.style.borderRightWidth).toBe('3px');

    updateInput(
      getControl(shadowRoot, 'boxShadow-blur') as InstanceType<typeof window.HTMLInputElement>,
      '20px'
    );
    click(getButtonControl(shadowRoot, 'boxShadow-inset'));
    updateInput(
      getControl(shadowRoot, 'filter') as InstanceType<typeof window.HTMLInputElement>,
      'blur(2px)'
    );

    expect(target.style.boxShadow).toContain('20px');
    expect(target.style.boxShadow).toContain('inset');
    expect(target.style.filter).toBe('blur(2px)');

    updateSelect(
      getControl(shadowRoot, 'positionType') as InstanceType<typeof window.HTMLSelectElement>,
      'absolute'
    );
    updateInput(
      getControl(shadowRoot, 'top') as InstanceType<typeof window.HTMLInputElement>,
      '12'
    );
    updateInput(
      getControl(shadowRoot, 'left') as InstanceType<typeof window.HTMLInputElement>,
      '18'
    );

    expect(target.style.position).toBe('absolute');
    expect(target.style.top).toBe('12px');
    expect(target.style.left).toBe('18px');

    click(getButtonControl(shadowRoot, 'flexDirection-column'));
    click(getButtonControl(shadowRoot, 'justifyContent-center'));
    updateInput(
      getControl(shadowRoot, 'gap') as InstanceType<typeof window.HTMLInputElement>,
      '24'
    );

    expect(target.style.flexDirection).toBe('column');
    expect(target.style.justifyContent).toBe('center');
    expect(target.style.gap).toBe('24px');
    expect(target.style.display).toBe('flex');
    cleanup();
  });
});
