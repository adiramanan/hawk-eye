// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSelectionDraft, rebaseSelectionDraft } from '../packages/client/src/drafts';
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

  it('seeds corner radius snapshots from authored border-radius shorthand', () => {
    const target = document.createElement('div');
    document.body.append(target);

    const draft = createSelectionDraft(
      createSelectionDetails({
        activeClassTargetId: 'src/styles.css::rounded',
        classNames: ['rounded'],
        classTargets: [
          {
            id: 'src/styles.css::rounded',
            className: 'rounded',
            selector: '.rounded',
            file: 'src/styles.css',
            line: 1,
            column: 1,
            fingerprint: 'rounded-fp',
            declaredPropertyIds: ['borderRadius'],
            declaredCssValues: {
              'border-radius': '20px',
            },
          },
        ],
        styleAnalysisResolved: true,
      }),
      target
    );

    expect(draft.properties.borderRadius.baseline).toBe('20px');
    expect(draft.properties.borderTopLeftRadius.baseline).toBe('20px');
    expect(draft.properties.borderTopRightRadius.baseline).toBe('20px');
    expect(draft.properties.borderBottomRightRadius.baseline).toBe('20px');
    expect(draft.properties.borderBottomLeftRadius.baseline).toBe('20px');

    target.remove();
  });

  it('falls back to computed value when the class declares a property via a CSS variable', () => {
    const target = document.createElement('div');
    target.style.borderRadius = '14px';
    document.body.append(target);

    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((node) => {
      const computed = originalGetComputedStyle(node);
      if (node !== target) return computed;
      return new Proxy(computed, {
        get(style, property, receiver) {
          if (property === 'getPropertyValue') {
            return (name: string) =>
              name === 'border-radius' ? '14px' : computed.getPropertyValue(name);
          }
          return Reflect.get(style, property, receiver);
        },
      }) as CSSStyleDeclaration;
    });

    const draft = createSelectionDraft(
      createSelectionDetails({
        activeClassTargetId: 'src/styles.css::chip',
        classNames: ['chip'],
        classTargets: [
          {
            id: 'src/styles.css::chip',
            className: 'chip',
            selector: '.chip',
            file: 'src/styles.css',
            line: 1,
            column: 1,
            fingerprint: 'chip-fp',
            declaredPropertyIds: ['borderRadius', 'paddingTop'],
            declaredCssValues: {
              'border-radius': 'var(--radius-full)',
              'padding-top': '4px',
            },
          },
        ],
        styleAnalysisResolved: true,
      }),
      target
    );

    // CSS variable: should fall back to computed value (14px)
    expect(draft.properties.borderRadius.baseline).toBe('14px');
    // Concrete value: should use the authored value directly
    expect(draft.properties.paddingTop.baseline).toBe('4px');

    target.remove();
  });

  it('rebases authored class baselines while preserving dirty property overrides', () => {
    const target = document.createElement('div');
    document.body.append(target);

    const initialDraft = createSelectionDraft(
      createSelectionDetails({
        activeClassTargetId: 'src/styles.css::dense',
        classNames: ['dense'],
        classTargets: [
          {
            id: 'src/styles.css::dense',
            className: 'dense',
            selector: '.dense',
            file: 'src/styles.css',
            line: 1,
            column: 1,
            fingerprint: 'dense-fp-1',
            declaredPropertyIds: ['paddingTop'],
            declaredCssValues: {
              padding: '12px',
            },
          },
        ],
        styleAnalysisResolved: true,
      }),
      target
    );

    const dirtyDraft = {
      ...initialDraft,
      properties: {
        ...initialDraft.properties,
        paddingTop: {
          ...initialDraft.properties.paddingTop,
          inputValue: '24px',
          value: '24px',
        },
      },
    };

    const rebasedDraft = rebaseSelectionDraft(
      dirtyDraft,
      createSelectionDetails({
        activeClassTargetId: 'src/styles.css::dense',
        analysisFingerprint: 'fp-2',
        classNames: ['dense'],
        classTargets: [
          {
            id: 'src/styles.css::dense',
            className: 'dense',
            selector: '.dense',
            file: 'src/styles.css',
            line: 1,
            column: 1,
            fingerprint: 'dense-fp-2',
            declaredPropertyIds: ['paddingTop', 'backgroundColor'],
            declaredCssValues: {
              padding: '20px',
              'background-color': 'rgb(17, 24, 39)',
            },
          },
        ],
        styleAnalysisResolved: true,
      }),
      target
    );

    expect(rebasedDraft.properties.paddingTop.baseline).toBe('20px');
    expect(rebasedDraft.properties.paddingTop.inputValue).toBe('24px');
    expect(rebasedDraft.properties.paddingTop.value).toBe('24px');
    expect(rebasedDraft.properties.backgroundColor.baseline).toBe('rgb(17, 24, 39)');
    expect(rebasedDraft.analysisFingerprint).toBe('fp-2');

    target.remove();
  });

  it('preserves the last resolved class context while a fresh analysis is pending', () => {
    const target = document.createElement('div');
    document.body.append(target);

    const resolvedDraft = createSelectionDraft(
      createSelectionDetails({
        activeClassTargetId: 'src/styles.css::dense',
        classNames: ['dense'],
        classTargets: [
          {
            id: 'src/styles.css::dense',
            className: 'dense',
            selector: '.dense',
            file: 'src/styles.css',
            line: 1,
            column: 1,
            fingerprint: 'dense-fp-1',
            declaredPropertyIds: ['paddingTop'],
            declaredCssValues: {
              padding: '12px',
            },
          },
        ],
        styleAnalysisResolved: true,
      }),
      target
    );

    const pendingDraft = rebaseSelectionDraft(
      resolvedDraft,
      createSelectionDetails({
        activeClassTargetId: null,
        analysisFingerprint: '',
        classNames: [],
        classTargets: [],
        styleAnalysisResolved: false,
      }),
      target
    );

    expect(pendingDraft.styleAnalysisResolved).toBe(false);
    expect(pendingDraft.classTargets).toHaveLength(1);
    expect(pendingDraft.activeClassTargetId).toBe('src/styles.css::dense');
    expect(pendingDraft.properties.paddingTop.baseline).toBe('12px');

    target.remove();
  });
});
