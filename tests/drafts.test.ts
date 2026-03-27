// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSelectionDraft } from '../packages/client/src/drafts';
import type { SelectionDetails } from '../packages/client/src/types';

function createSelectionDetails(overrides: Partial<SelectionDetails> = {}): SelectionDetails {
  return {
    analysisFingerprint: '',
    classAttributeState: 'missing',
    classNames: [],
    column: 1,
    file: 'demo/src/App.tsx',
    inlineStyles: {},
    instanceKey: 'demo/src/App.tsx:10:3@@0',
    line: 10,
    saveCapability: null,
    saveEnabled: false,
    source: 'demo/src/App.tsx:10:3',
    styleAnalysisResolved: false,
    styleAttributeState: 'missing',
    styleMode: 'inline',
    tagName: 'div',
    ...overrides,
  };
}

describe('draft creation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves authored width and height values instead of replacing them with computed pixels', () => {
    const target = document.createElement('div');
    target.style.width = '75%';
    target.style.height = '50%';
    document.body.append(target);

    target.getBoundingClientRect = () =>
      ({
        bottom: 120,
        height: 120,
        left: 0,
        right: 240,
        top: 0,
        width: 240,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const originalGetComputedStyle = window.getComputedStyle.bind(window);

    vi.spyOn(window, 'getComputedStyle').mockImplementation((node: Element) => {
      const computedStyle = originalGetComputedStyle(node);

      if (node !== target) {
        return computedStyle;
      }

      return new Proxy(computedStyle, {
        get(style, property, receiver) {
          if (property === 'width') {
            return '240px';
          }

          if (property === 'height') {
            return '120px';
          }

          if (property === 'display') {
            return 'block';
          }

          if (property === 'getPropertyValue') {
            return (name: string) => {
              if (name === 'width') {
                return '240px';
              }

              if (name === 'height') {
                return '120px';
              }

              if (name === 'display') {
                return 'block';
              }

              return computedStyle.getPropertyValue(name);
            };
          }

          return Reflect.get(style, property, receiver);
        },
      }) as CSSStyleDeclaration;
    });

    const draft = createSelectionDraft(createSelectionDetails(), target);

    expect(draft.properties.width.baseline).toBe('75%');
    expect(draft.properties.height.baseline).toBe('50%');
    expect(draft.sizeControl.widthMode.baseline).toBe('relative');
    expect(draft.sizeControl.heightMode.baseline).toBe('relative');
    expect(draft.sizeControl.widthMemory.relative).toBe('75%');
    expect(draft.sizeControl.heightMemory.relative).toBe('50%');

    target.remove();
  });

  it('preserves width and height keyword baselines used by fill and hug sizing', () => {
    const parent = document.createElement('div');
    parent.style.display = 'flex';
    parent.style.flexDirection = 'row';
    document.body.append(parent);

    const target = document.createElement('div');
    target.style.width = 'auto';
    target.style.height = 'fit-content';
    target.style.flexGrow = '1';
    parent.append(target);

    target.getBoundingClientRect = () =>
      ({
        bottom: 80,
        height: 80,
        left: 0,
        right: 300,
        top: 0,
        width: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const draft = createSelectionDraft(createSelectionDetails(), target);

    expect(draft.properties.width.baseline).toBe('auto');
    expect(draft.properties.height.baseline).toBe('fit-content');
    expect(draft.sizeControl.widthMode.baseline).toBe('fill');
    expect(draft.sizeControl.heightMode.baseline).toBe('hug');

    parent.remove();
  });
});
