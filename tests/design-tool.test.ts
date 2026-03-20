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

function getFooterApplyButton(shadowRoot: { querySelector(selectors: string): Element | null }) {
  const button = shadowRoot.querySelector('[data-hawk-eye-ui="footer-apply-btn"]');

  if (!(button instanceof window.HTMLButtonElement)) {
    throw new Error('Could not find footer apply button');
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

  if (
    !(input instanceof window.HTMLInputElement) &&
    !(input instanceof window.HTMLSelectElement)
  ) {
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
  vi.restoreAllMocks();
});

describe('DesignTool', () => {
  it('toggles inspector mode from the floating trigger', () => {
    const { cleanup, host, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]');

    expect(shadowRoot.textContent).toContain('Inspect with Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).toBeNull();

    click(trigger as Element);
    expect(shadowRoot.textContent).toContain('Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).not.toBeNull();
    expect(shadowRoot.textContent).not.toContain('Inspect with Hawk-Eye');

    click(shadowRoot.querySelector('[data-hawk-eye-ui="panel-close-btn"]') as Element);
    expect(shadowRoot.textContent).toContain('Inspect with Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel"]')).toBeNull();
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

    const { cleanup, host, shadowRoot } = renderDesignTool();
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

    expect(hot.send).toHaveBeenCalledWith(HAWK_EYE_INSPECT_EVENT, {
      source: 'demo/src/App.tsx:21:13',
    });
    expect(hot.send).toHaveBeenCalledWith(HAWK_EYE_ANALYZE_STYLE_EVENT, {
      source: 'demo/src/App.tsx:21:13',
    });
    expect(shadowRoot.textContent).toContain('Hawk-Eye');
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel-source"]')).toBeNull();
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="positionSize"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="autoLayout"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="fillOpacity"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="border"]')).toHaveLength(1);
    expect(shadowRoot.querySelectorAll('[data-hawk-eye-section="typography"]')).toHaveLength(1);
    expect(getControl(shadowRoot, 'paddingTop').value).toBe('16');
    expect(getInputByLabel(shadowRoot, 'Corner Radius all sides').value).toBe('14');
    expect(getControl(shadowRoot, 'fontWeight').value).toBe('600');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="backgroundColor"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="opacity"]')).not.toBeNull();
    // width, layout mode, and font family are now in the focused panel
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="layout-none"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="fontFamily"]')).not.toBeNull();

    act(() => {
      hot.emit('hawk-eye:style-analysis', {
        source: 'demo/src/App.tsx:21:13',
        mode: 'tailwind',
        classNames: ['px-4', 'py-2', 'rounded-lg'],
        inlineStyles: {},
        fingerprint: 'fp-21-13',
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).not.toBeNull();
    cleanup();
  });

  it('hides the Appearance fill control for plain text selections while keeping text color available', () => {
    const hot = createHotStub();
    globalThis.__HAWK_EYE_HOT__ = hot;

    const target = document.createElement('span');
    target.textContent = 'Headline';
    applyBaselineStyles(target, 'demo/src/App.tsx:23:15');
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
    expect(shadowRoot.querySelector('[data-hawk-eye-control="backgroundColor"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="opacity"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="color"]')).not.toBeNull();
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

    const { cleanup, host, shadowRoot } = renderDesignTool();
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
      hot.emit('hawk-eye:style-analysis', {
        source: 'demo/src/App.tsx:34:9',
        mode: 'tailwind',
        classNames: ['px-4', 'py-2', 'rounded-lg'],
        inlineStyles: {},
        fingerprint: 'fp-34-9',
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'detach'));

    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    expect(target.style.paddingTop).toBe('16px');

    act(() => {
      hot.emit('hawk-eye:style-analysis', {
        source: 'demo/src/App.tsx:34:9',
        mode: 'tailwind',
        classNames: ['px-4', 'py-2', 'rounded-lg'],
        inlineStyles: {},
        fingerprint: 'fp-34-9',
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    cleanup();
  });

  it('applies dirty drafts to source only after clicking Update Design and keeps the selection active after a successful write', () => {
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
      hot.emit('hawk-eye:style-analysis', {
        source: 'demo/src/App.tsx:52:11',
        mode: 'tailwind',
        classNames: ['pt-4'],
        inlineStyles: {},
        fingerprint: 'fp-52-11',
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '24px'
    );

    expect(target.style.paddingTop).toBe('24px');
    expect(
      hot.send.mock.calls.filter(([event]) => event === HAWK_EYE_SAVE_EVENT)
    ).toHaveLength(0);

    const applyButton = getFooterApplyButton(shadowRoot);
    expect(applyButton.textContent).toContain('Update Design');

    setElementFromPoint(host);
    click(applyButton);

    expect(hot.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_EVENT, {
      capability: SAVE_CAPABILITY,
      mutations: [
        {
          file: 'demo/src/App.tsx',
          line: 52,
          column: 11,
          detached: false,
          fingerprint: 'fp-52-11',
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
    const status = shadowRoot.querySelector('[data-hawk-eye-ui="footer-status"]');

    if (!(status instanceof window.HTMLParagraphElement)) {
      throw new Error('Missing footer status');
    }

    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Updated demo/src/App.tsx.');
    expect(shadowRoot.textContent).not.toContain('No element selected');
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

    updateInput(fontSizeInput() as InstanceType<typeof window.HTMLInputElement>, 'banana');
    expect(target.style.fontSize).toBe('1.5rem');
    expect(fontSizeInput().value).toBe('banana');
    // compact card marks invalid state via data-invalid attribute; no inline text in new panel
    expect(
      shadowRoot.querySelector('[data-hawk-eye-control="fontSize"]')?.closest('[data-invalid="true"]')
    ).not.toBeNull();
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

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;
    const paddingToggle = () =>
      shadowRoot.querySelector<HTMLButtonElement>(
        '[data-property-id="padding"] [data-hawk-eye-ui="link-toggle-btn"]'
      );

    click(trigger);
    click(document);

    updateInput(
      getInputByLabel(shadowRoot, 'Padding all sides') as InstanceType<typeof window.HTMLInputElement>,
      '20'
    );
    expect(target.style.paddingTop).toBe('20px');
    expect(target.style.paddingRight).toBe('20px');
    expect(target.style.paddingBottom).toBe('20px');
    expect(target.style.paddingLeft).toBe('20px');

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
    expect(target.style.paddingRight).toBe('20px');

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '26px'
    );

    expect(target.style.paddingTop).toBe('26px');
    expect(target.style.paddingRight).toBe('20px');
    expect(target.style.paddingBottom).toBe('20px');
    expect(target.style.paddingLeft).toBe('20px');
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

    const fontSizeCard = shadowRoot.querySelector(
      '[data-property-id="fontSize"]'
    );

    if (!(fontSizeCard instanceof window.HTMLElement)) {
      throw new Error('Missing fontSize card');
    }

    const fontSizeReset = fontSizeCard.querySelector(
      '[data-hawk-eye-ui="control-reset-mini"]'
    );

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

  it('tracks size mode-only changes in the changes view', () => {
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
    chooseSizeMenuOption(shadowRoot, 'width-mode', 'relative');

    expect(target.style.width).toBe('100%');

    const tabs = shadowRoot.querySelectorAll('[data-hawk-eye-ui="panel-tab"]');
    click(tabs[0] as Element);

    const changesButton = shadowRoot.querySelector('[data-hawk-eye-ui="footer-changes-btn"]');

    if (!(changesButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing changes button');
    }

    expect(changesButton.textContent).toContain('1 Change');
    click(changesButton);
    expect(shadowRoot.textContent).toContain('width mode');
    cleanup();
  });

  it('keeps flex sizing behind width and height modes while grid children use spans', () => {
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

    chooseSizeMenuOption(shadowRoot, 'width-mode', 'fill');

    expect(flexChild.style.width).toBe('auto');
    expect(flexChild.style.flexGrow).toBe('1');
    expect(flexChild.style.flexBasis).toBe('0px');

    setElementFromPoint(gridChild);
    click(document);

    expect(shadowRoot.textContent).toContain('This Grid');
    expect(shadowRoot.textContent).toContain('In Parent Grid');
    expect(getControl(shadowRoot, 'gridColumns-mode-0').value).toBe('fill');
    expect(getControl(shadowRoot, 'gridColumns-value-0').value).toBe('1');
    expect(getControl(shadowRoot, 'gridRows-mode-0').value).toBe('hug');
    expect(getControl(shadowRoot, 'gridRows-value-0').value).toBe('72');
    expect(getControl(shadowRoot, 'columnSpan').value).toBe('1');
    expect(getControl(shadowRoot, 'rowSpan').value).toBe('1');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="alignSelf"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="width-mode"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-control="height-mode"]')).toBeNull();

    updateInput(
      getControl(shadowRoot, 'gridColumns-value-0') as InstanceType<typeof window.HTMLInputElement>,
      '0.75'
    );
    click(getButtonControl(shadowRoot, 'gridColumns-add'));
    updateSelect(
      getControl(shadowRoot, 'gridRows-mode-1') as InstanceType<typeof window.HTMLSelectElement>,
      'fixed'
    );
    updateInput(
      getControl(shadowRoot, 'gridRows-value-1') as InstanceType<typeof window.HTMLInputElement>,
      '96'
    );
    click(getButtonControl(shadowRoot, 'gridRows-add'));
    click(getButtonControl(shadowRoot, 'gridRows-remove-0'));

    updateInput(
      getControl(shadowRoot, 'columnSpan') as InstanceType<typeof window.HTMLInputElement>,
      '2'
    );
    updateInput(
      getControl(shadowRoot, 'rowSpan') as InstanceType<typeof window.HTMLInputElement>,
      '3'
    );

    expect(gridChild.style.gridTemplateColumns).toBe('0.75fr 1fr 1fr');
    expect(gridChild.style.gridTemplateRows).toBe('96px 96px');
    expect(gridChild.style.gridColumn).toBe('span 2 / span 2');
    expect(gridChild.style.gridRow).toBe('span 3 / span 3');
    cleanup();
  });

  it('preserves separate fixed and relative size values across mode switches and reselection', () => {
    const first = document.createElement('div');
    applyBaselineStyles(first, 'demo/src/App.tsx:72:9');
    mockRect(first, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(first);

    const second = document.createElement('div');
    applyBaselineStyles(second, 'demo/src/App.tsx:74:9');
    second.style.width = '80px';
    mockRect(second, { height: 48, left: 220, top: 40, width: 80 });
    document.body.append(second);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);

    setElementFromPoint(first);
    click(document);

    updateInput(
      getControl(shadowRoot, 'width') as InstanceType<typeof window.HTMLInputElement>,
      '200'
    );
    expect(first.style.width).toBe('200px');

    chooseSizeMenuOption(shadowRoot, 'width-mode', 'relative');
    expect(first.style.width).toBe('100%');

    updateInput(
      getControl(shadowRoot, 'width') as InstanceType<typeof window.HTMLInputElement>,
      '75'
    );
    expect(first.style.width).toBe('75%');

    chooseSizeMenuOption(shadowRoot, 'width-mode', 'fixed');
    expect(first.style.width).toBe('200px');

    chooseSizeMenuOption(shadowRoot, 'width-mode', 'relative');
    expect(first.style.width).toBe('75%');

    setElementFromPoint(second);
    click(document);
    setElementFromPoint(first);
    click(document);

    expect(getButtonControl(shadowRoot, 'width-mode').dataset.value).toBe('relative');
    expect(
      (getControl(shadowRoot, 'width') as InstanceType<typeof window.HTMLInputElement>).value
    ).toBe('75');
    cleanup();
  });

  it('locks and unlocks width and height using the current aspect ratio', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:14:3');
    mockRect(target, { height: 48, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);
    const lockButton = shadowRoot.querySelector('[data-hawk-eye-ui="aspect-ratio-lock-button"]');

    if (!(lockButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing aspect ratio lock button');
    }

    click(lockButton);

    updateInput(
      getControl(shadowRoot, 'width') as InstanceType<typeof window.HTMLInputElement>,
      '240'
    );
    expect(target.style.width).toBe('240px');
    expect(target.style.height).toBe('96px');

    click(lockButton);
    updateInput(
      getControl(shadowRoot, 'width') as InstanceType<typeof window.HTMLInputElement>,
      '300'
    );
    expect(target.style.width).toBe('300px');
    expect(target.style.height).toBe('96px');
    cleanup();
  });

  it('locks aspect ratio from the size field values instead of the measured box', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:18:4');
    target.style.width = '20px';
    target.style.height = '40px';
    mockRect(target, { height: 120, left: 24, top: 40, width: 120 });
    document.body.append(target);
    setElementFromPoint(target);

    const { cleanup, shadowRoot } = renderDesignTool();
    const trigger = shadowRoot.querySelector('[data-hawk-eye-ui="trigger"]') as Element;

    click(trigger);
    click(document);

    const lockButton = shadowRoot.querySelector('[data-hawk-eye-ui="aspect-ratio-lock-button"]');

    if (!(lockButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing aspect ratio lock button');
    }

    click(lockButton);

    updateInput(
      getControl(shadowRoot, 'width') as InstanceType<typeof window.HTMLInputElement>,
      '40'
    );

    expect(target.style.width).toBe('40px');
    expect(target.style.height).toBe('80px');
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
    const paddingInput = () => getControl(shadowRoot, 'paddingTop');
    const marginInput = () => getControl(shadowRoot, 'marginTop');

    click(trigger);

    setElementFromPoint(first);
    click(document);
    updateInput(
      paddingInput() as InstanceType<typeof window.HTMLInputElement>,
      '24'
    );

    setElementFromPoint(second);
    click(document);
    updateInput(
      marginInput() as InstanceType<typeof window.HTMLInputElement>,
      '12'
    );

    expect(first.style.paddingTop).toBe('24px');
    expect(second.style.marginTop).toBe('12px');
    expect(shadowRoot.querySelector('[data-hawk-eye-control="detach"]')).toBeNull();
    expect(shadowRoot.querySelector('[data-hawk-eye-ui="panel-source"]')).toBeNull();

    setElementFromPoint(first);
    click(document);

    expect(paddingInput().value).toBe('24');
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
      hot.emit('hawk-eye:style-analysis', {
        source: 'demo/src/App.tsx:14:3',
        mode: 'tailwind',
        classNames: ['pt-4'],
        inlineStyles: {},
        fingerprint: 'fp-14-3',
        saveCapability: SAVE_CAPABILITY,
        saveEnabled: true,
      });
    });

    updateInput(
      getControl(shadowRoot, 'paddingTop') as InstanceType<typeof window.HTMLInputElement>,
      '28px'
    );

    expect(target.style.paddingTop).toBe('28px');
    pressEscape();

    expect(shadowRoot.textContent).toContain('Apply or revert changes before closing the inspector.');
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

  it('supports focused fill, typography, appearance, and border controls', () => {
    const target = document.createElement('div');
    applyBaselineStyles(target, 'demo/src/App.tsx:44:11');
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
    updateInput(
      getControl(shadowRoot, 'fontSize') as InstanceType<typeof window.HTMLInputElement>,
      '24'
    );
    updateInput(
      getControl(shadowRoot, 'color') as InstanceType<typeof window.HTMLInputElement>,
      '#778899'
    );
    setElementFromPoint(host);
    click(getButtonControl(shadowRoot, 'textAlign-center'));
    updateInput(
      getInputByLabel(shadowRoot, 'Corner Radius all sides') as InstanceType<typeof window.HTMLInputElement>,
      '22'
    );
    updateInput(
      getControl(shadowRoot, 'borderColor') as InstanceType<typeof window.HTMLInputElement>,
      '#445566'
    );
    updateInput(
      getInputByLabel(shadowRoot, 'Stroke Weight all sides') as InstanceType<typeof window.HTMLInputElement>,
      '2'
    );

    expect(target.style.backgroundColor).toBe('rgb(17, 34, 51)');
    expect(target.style.color).toBe('rgb(119, 136, 153)');
    expect(target.style.fontWeight).toBe('700');
    expect(target.style.fontSize).toBe('24px');
    expect(target.style.textAlign).toBe('center');
    expect(target.style.borderTopLeftRadius).toBe('22px');
    expect(target.style.borderColor).toBe('rgb(68, 85, 102)');
    expect(target.style.borderTopWidth).toBe('2px');
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
    expect(shadowRoot.querySelector('[data-hawk-eye-control="layout-none"]')).not.toBeNull();
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
