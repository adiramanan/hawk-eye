// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../shared/protocol';
import { editablePropertyDefinitionMap, editablePropertyDefinitions } from '../packages/client/src/editable-properties';
import { ColorInput } from '../packages/client/src/controls/ColorInput';
import { PerCornerControl } from '../packages/client/src/controls/PerCornerControl';
import { GridTrackEditor } from '../packages/client/src/controls/GridTrackEditor';
import { NumberInput } from '../packages/client/src/controls/NumberInput';
import { PerSideControl } from '../packages/client/src/controls/PerSideControl';
import { SizeInput } from '../packages/client/src/controls/SizeInput';
import { applyDraftInputValue, createInspectableElementKey } from '../packages/client/src/drafts';
import { LayersPanel } from '../packages/client/src/LayersPanel';
import type { PropertySnapshot } from '../packages/client/src/types';
import { rgbaToOklchString } from '../packages/client/src/utils/color';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mountedCleanups = new Set<() => void>();

function renderComponent(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.append(container);

  const root = createRoot(container);

  function render(nextElement: React.ReactElement) {
    act(() => {
      root.render(nextElement);
    });
  }

  render(element);

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
    cleanup,
    container,
    render,
  };
}

function click(node: Element) {
  act(() => {
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    );
  });
}

function keyDown(node: Element, key: string) {
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

afterEach(() => {
  for (const cleanup of Array.from(mountedCleanups)) {
    cleanup();
  }

  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('client UI controls', () => {
  it('maps flex direction labels to the matching CSS values', () => {
    const definition = editablePropertyDefinitions.find(
      (candidate) => candidate.id === 'flexDirection'
    );

    expect(definition?.options).toEqual([
      { label: 'Row', value: 'row' },
      { label: 'Col', value: 'column' },
      { label: 'Row-R', value: 'row-reverse' },
      { label: 'Col-R', value: 'column-reverse' },
    ]);
  });

  it('renders focusable disclosure and selection buttons for layer rows', () => {
    const parent = document.createElement('section');
    parent.setAttribute(HAWK_EYE_SOURCE_ATTRIBUTE, 'demo/src/App.tsx:10:1');
    parent.setAttribute('aria-label', 'Hero section');

    const child = document.createElement('button');
    child.setAttribute(HAWK_EYE_SOURCE_ATTRIBUTE, 'demo/src/App.tsx:11:3');
    child.textContent = 'CTA';

    parent.append(child);
    document.body.append(parent);

    const parentKey = createInspectableElementKey(parent);
    const onSelectByKey = vi.fn();
    const view = renderComponent(
      React.createElement(LayersPanel, {
        selectedInstanceKey: null,
        onSelectByKey,
      })
    );

    const expandButton = view.container.querySelector(
      '[data-hawk-eye-ui="layer-expand-btn"]:not(:disabled)'
    );

    if (!(expandButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing enabled disclosure button');
    }

    const selectionButtons = view.container.querySelectorAll('[data-hawk-eye-ui="layer-select-btn"]');

    expect(selectionButtons).toHaveLength(2);
    expect(expandButton.getAttribute('aria-expanded')).toBe('true');

    expandButton.focus();
    expect(document.activeElement).toBe(expandButton);

    const parentSelect = selectionButtons[0];

    if (!(parentSelect instanceof window.HTMLButtonElement)) {
      throw new Error('Missing layer selection button');
    }

    parentSelect.focus();
    expect(document.activeElement).toBe(parentSelect);

    click(parentSelect);
    expect(onSelectByKey).toHaveBeenCalledWith(parentKey);

    click(expandButton);
    expect(expandButton.getAttribute('aria-expanded')).toBe('false');
    expect(view.container.querySelectorAll('[data-hawk-eye-ui="layer-select-btn"]')).toHaveLength(1);

    view.render(
      React.createElement(LayersPanel, {
        selectedInstanceKey: parentKey,
        onSelectByKey,
      })
    );

    expect(
      view.container.querySelector('[data-hawk-eye-ui="layer-select-btn"][aria-pressed="true"]')
    ).not.toBeNull();
  });

  it('uses listbox semantics and keyboard navigation for size mode selection', () => {
    const snapshot: PropertySnapshot = {
      baseline: '120px',
      inlineValue: '120px',
      inputValue: '120px',
      invalid: false,
      value: '120px',
    };
    const onChange = vi.fn();
    const onModeChange = vi.fn();
    const view = renderComponent(
      React.createElement(SizeInput, {
        definition: editablePropertyDefinitionMap.width,
        label: 'W',
        mode: 'fixed',
        onChange,
        onModeChange,
        snapshot,
      })
    );

    const trigger = view.container.querySelector('[data-hawk-eye-control="width-mode"]');

    if (!(trigger instanceof window.HTMLButtonElement)) {
      throw new Error('Missing size mode trigger');
    }

    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    keyDown(trigger, ' ');

    const listbox = view.container.querySelector('[role="listbox"]');

    if (!(listbox instanceof window.HTMLElement)) {
      throw new Error('Missing size mode listbox');
    }

    const options = Array.from(
      view.container.querySelectorAll('[data-hawk-eye-ui="size-input-menu-option"]')
    );

    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
    expect(options).toHaveLength(4);
    expect(document.activeElement).toBe(options[0]);
    expect(options[0]?.getAttribute('role')).toBe('option');
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');

    keyDown(options[0] as Element, 'End');
    expect(document.activeElement).toBe(options[3]);

    keyDown(options[3] as Element, 'Home');
    expect(document.activeElement).toBe(options[0]);

    keyDown(options[0] as Element, 'Escape');
    expect(view.container.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);

    keyDown(trigger, 'ArrowDown');

    const reopenedOptions = Array.from(
      view.container.querySelectorAll('[data-hawk-eye-ui="size-input-menu-option"]')
    );

    expect(document.activeElement).toBe(reopenedOptions[1]);

    keyDown(reopenedOptions[1] as Element, 'Enter');
    expect(onModeChange).toHaveBeenCalledWith('hug');
    expect(view.container.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens the color picker and commits hex color changes', () => {
    const snapshot: PropertySnapshot = {
      baseline: '#112233',
      inlineValue: '#112233',
      inputValue: '#112233',
      invalid: false,
      value: '#112233',
    };
    const onChange = vi.fn();
    const view = renderComponent(
      React.createElement(ColorInput, {
        definition: editablePropertyDefinitionMap.backgroundColor,
        onChange,
        snapshot,
      })
    );

    const swatchButton = view.container.querySelector('[data-hawk-eye-ui="color-swatch-btn"]');

    if (!(swatchButton instanceof window.HTMLButtonElement)) {
      throw new Error('Missing color swatch button');
    }

    click(swatchButton);

    const dialog = view.container.querySelector('[data-hawk-eye-ui="color-popover"]');

    if (!(dialog instanceof window.HTMLElement)) {
      throw new Error('Missing color picker popover');
    }

    const hexInput = dialog.querySelector('[data-hawk-eye-ui="color-fallback-fields"] [data-hawk-eye-ui="text-input"]');

    if (!(hexInput instanceof window.HTMLInputElement)) {
      throw new Error('Missing hex color input');
    }

    updateInput(hexInput, 'ff6600');
    keyDown(hexInput, 'Enter');

    expect(onChange).toHaveBeenCalledWith('#ff6600');
  });

  it('normalizes initialized oklch colors to hex in the text field', () => {
    const oklchValue = rgbaToOklchString({ r: 68, g: 85, b: 102, a: 1 });
    const snapshot: PropertySnapshot = {
      baseline: oklchValue,
      inlineValue: oklchValue,
      inputValue: oklchValue,
      invalid: false,
      value: oklchValue,
    };
    const onChange = vi.fn();
    const view = renderComponent(
      React.createElement(ColorInput, {
        definition: editablePropertyDefinitionMap.borderColor,
        onChange,
        snapshot,
      })
    );

    const input = view.container.querySelector('[data-hawk-eye-control="borderColor"]');

    if (!(input instanceof window.HTMLInputElement)) {
      throw new Error('Missing border color input');
    }

    expect(input.value).toBe('#445566');
  });

  it('applies the visible top value to every side immediately when linking all sides', () => {
    const onChange = vi.fn();
    const makeSnapshot = (value: string): PropertySnapshot => ({
      baseline: value,
      inlineValue: value,
      inputValue: value,
      invalid: false,
      value,
    });

    const view = renderComponent(
      React.createElement(PerSideControl, {
        grouping: 'all-each',
        label: 'Margin',
        onChange,
        sides: {
          top: { id: 'marginTop', snapshot: makeSnapshot('24px') },
          right: { id: 'marginRight', snapshot: makeSnapshot('8px') },
          bottom: { id: 'marginBottom', snapshot: makeSnapshot('12px') },
          left: { id: 'marginLeft', snapshot: makeSnapshot('16px') },
        },
      })
    );

    const toggle = view.container.querySelector('[data-hawk-eye-ui="link-toggle-btn"]');

    if (!(toggle instanceof window.HTMLButtonElement)) {
      throw new Error('Missing side link toggle');
    }

    click(toggle);

    expect(onChange).toHaveBeenCalledWith('marginTop', '24px');
    expect(onChange).toHaveBeenCalledWith('marginRight', '24px');
    expect(onChange).toHaveBeenCalledWith('marginBottom', '24px');
    expect(onChange).toHaveBeenCalledWith('marginLeft', '24px');
  });

  it('applies the visible top-left value to every corner immediately when linking corners', () => {
    const onChange = vi.fn();
    const makeSnapshot = (value: string): PropertySnapshot => ({
      baseline: value,
      inlineValue: value,
      inputValue: value,
      invalid: false,
      value,
    });

    const view = renderComponent(
      React.createElement(PerCornerControl, {
        label: 'Corner Radius',
        onChange,
        corners: {
          topLeft: { id: 'borderTopLeftRadius', snapshot: makeSnapshot('24px') },
          topRight: { id: 'borderTopRightRadius', snapshot: makeSnapshot('8px') },
          bottomRight: { id: 'borderBottomRightRadius', snapshot: makeSnapshot('12px') },
          bottomLeft: { id: 'borderBottomLeftRadius', snapshot: makeSnapshot('16px') },
        },
      })
    );

    const toggle = view.container.querySelector('[data-hawk-eye-ui="per-side-link"]');

    if (!(toggle instanceof window.HTMLButtonElement)) {
      throw new Error('Missing corner link toggle');
    }

    click(toggle);

    expect(onChange).toHaveBeenCalledWith('borderTopLeftRadius', '24px');
    expect(onChange).toHaveBeenCalledWith('borderTopRightRadius', '24px');
    expect(onChange).toHaveBeenCalledWith('borderBottomRightRadius', '24px');
    expect(onChange).toHaveBeenCalledWith('borderBottomLeftRadius', '24px');
  });

  it('renders unit-bearing number inputs inside a single shared shell', () => {
    const multiUnitSnapshot: PropertySnapshot = {
      baseline: '18px',
      inlineValue: '18px',
      inputValue: '18px',
      invalid: false,
      value: '18px',
    };
    const singleUnitSnapshot: PropertySnapshot = {
      baseline: '1px',
      inlineValue: '1px',
      inputValue: '1px',
      invalid: false,
      value: '1px',
    };
    const onChange = vi.fn();
    const view = renderComponent(
      React.createElement(NumberInput, {
        definition: editablePropertyDefinitionMap.fontSize,
        snapshot: multiUnitSnapshot,
        onChange,
      })
    );

    expect(view.container.querySelectorAll('[data-hawk-eye-ui="number-input-shell"]')).toHaveLength(1);
    expect(view.container.querySelector('[data-hawk-eye-control="fontSize"]')).not.toBeNull();
    expect(view.container.querySelector('[data-hawk-eye-control="fontSize-unit"]')).not.toBeNull();

    view.render(
      React.createElement(NumberInput, {
        definition: editablePropertyDefinitionMap.borderTopWidth,
        snapshot: singleUnitSnapshot,
        onChange,
      })
    );

    expect(view.container.querySelectorAll('[data-hawk-eye-ui="number-input-shell"]')).toHaveLength(1);
    expect(view.container.querySelector('[data-hawk-eye-control="borderTopWidth"]')).not.toBeNull();
    expect(view.container.querySelector('[data-hawk-eye-control="borderTopWidth-unit"]')).toBeNull();
    expect(view.container.querySelector('[data-hawk-eye-ui="input-unit-label"]')?.textContent).toBe('px');
  });

  it('renders editable grid track rows for columns and rows', () => {
    const onChange = vi.fn();
    const view = renderComponent(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(GridTrackEditor, {
          axis: 'columns',
          label: 'Columns',
          onChange,
          propertyId: 'gridColumns',
          snapshot: {
            baseline: 'repeat(2, 1fr)',
            inlineValue: '',
            inputValue: 'repeat(2, 1fr)',
            invalid: false,
            value: 'repeat(2, 1fr)',
          },
        }),
        React.createElement(GridTrackEditor, {
          axis: 'rows',
          label: 'Rows',
          onChange,
          propertyId: 'gridRows',
          snapshot: {
            baseline: 'fit-content(72px) fit-content(72px)',
            inlineValue: '',
            inputValue: 'fit-content(72px) fit-content(72px)',
            invalid: false,
            value: 'fit-content(72px) fit-content(72px)',
          },
        })
      )
    );

    expect(
      (view.container.querySelector('[data-hawk-eye-control="gridColumns-value-0"]') as HTMLInputElement)
        .value
    ).toBe('1');
    expect(
      (view.container.querySelector('[data-hawk-eye-control="gridRows-value-0"]') as HTMLInputElement)
        .value
    ).toBe('72');
    expect(
      (view.container.querySelector('[data-hawk-eye-control="gridColumns-mode-0"]') as HTMLSelectElement)
        .value
    ).toBe('fill');
    expect(
      (view.container.querySelector('[data-hawk-eye-control="gridRows-mode-0"]') as HTMLSelectElement)
        .value
    ).toBe('hug');
  });

  it('supports add, remove, mode changes, and lossy normalization in the grid track editor', () => {
    const onChange = vi.fn();
    const view = renderComponent(
      React.createElement(GridTrackEditor, {
        axis: 'columns',
        label: 'Columns',
        onChange,
        propertyId: 'gridColumns',
        snapshot: {
          baseline: 'minmax(120px, 1fr) 2fr',
          inlineValue: '',
          inputValue: 'minmax(120px, 1fr) 2fr',
          invalid: false,
          value: 'minmax(120px, 1fr) 2fr',
        },
      })
    );

    expect(view.container.textContent).toContain('Custom track CSS was normalized');
    expect(
      (view.container.querySelector('[data-hawk-eye-control="gridColumns-mode-0"]') as HTMLSelectElement)
        .value
    ).toBe('fill');
    expect(
      (view.container.querySelector('[data-hawk-eye-control="gridColumns-value-0"]') as HTMLInputElement)
        .value
    ).toBe('1');

    updateSelect(
      view.container.querySelector('[data-hawk-eye-control="gridColumns-mode-0"]') as HTMLSelectElement,
      'fixed'
    );
    expect(onChange).toHaveBeenLastCalledWith('1px 2fr');

    view.render(
      React.createElement(GridTrackEditor, {
        axis: 'columns',
        label: 'Columns',
        onChange,
        propertyId: 'gridColumns',
        snapshot: {
          baseline: '1px 2fr',
          inlineValue: '',
          inputValue: '1px 2fr',
          invalid: false,
          value: '1px 2fr',
        },
      })
    );
    expect(view.container.querySelector('[data-hawk-eye-ui="grid-track-unit"]')?.textContent).toBe('px');

    updateInput(
      view.container.querySelector('[data-hawk-eye-control="gridColumns-value-0"]') as HTMLInputElement,
      '3'
    );
    expect(onChange).toHaveBeenLastCalledWith('3px 2fr');

    click(
      view.container.querySelector('[data-hawk-eye-control="gridColumns-add"]') as HTMLButtonElement
    );
    expect(onChange).toHaveBeenLastCalledWith('1px 2fr 2fr');

    view.render(
      React.createElement(GridTrackEditor, {
        axis: 'columns',
        label: 'Columns',
        onChange,
        propertyId: 'gridColumns',
        snapshot: {
          baseline: '1px 2fr 2fr',
          inlineValue: '',
          inputValue: '1px 2fr 2fr',
          invalid: false,
          value: '1px 2fr 2fr',
        },
      })
    );

    click(
      view.container.querySelector('[data-hawk-eye-control="gridColumns-remove-1"]') as HTMLButtonElement
    );
    expect(onChange).toHaveBeenLastCalledWith('1px 2fr');
  });

  it('accepts already-transformed grid CSS and span CSS without wrapping them again', () => {
    const element = document.createElement('div');

    const gridTemplateSnapshot: PropertySnapshot = {
      baseline: 'repeat(2, 1fr)',
      inlineValue: '',
      inputValue: 'repeat(2, 1fr)',
      invalid: false,
      value: 'repeat(2, 1fr)',
    };
    const spanSnapshot: PropertySnapshot = {
      baseline: 'auto',
      inlineValue: '',
      inputValue: 'auto',
      invalid: false,
      value: 'auto',
    };

    expect(
      applyDraftInputValue(element, 'gridColumns', gridTemplateSnapshot, 'repeat(2, 1fr)')
    ).toMatchObject({
      invalid: false,
      value: 'repeat(2, 1fr)',
    });
    expect(applyDraftInputValue(element, 'columnSpan', spanSnapshot, 'auto')).toMatchObject({
      invalid: false,
      value: 'auto',
    });
  });

  it('renders auto and explicit grid spans as numerals', () => {
    const onChange = vi.fn();
    const view = renderComponent(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(NumberInput, {
          definition: editablePropertyDefinitionMap.columnSpan,
          onChange,
          snapshot: {
            baseline: 'auto',
            inlineValue: '',
            inputValue: 'auto',
            invalid: false,
            value: 'auto',
          },
        }),
        React.createElement(NumberInput, {
          definition: editablePropertyDefinitionMap.rowSpan,
          onChange,
          snapshot: {
            baseline: 'span 2 / span 2',
            inlineValue: '',
            inputValue: 'span 2 / span 2',
            invalid: false,
            value: 'span 2 / span 2',
          },
        })
      )
    );

    expect(
      (view.container.querySelector('[data-hawk-eye-control="columnSpan"]') as HTMLInputElement)
        .value
    ).toBe('1');
    expect(
      (view.container.querySelector('[data-hawk-eye-control="rowSpan"]') as HTMLInputElement).value
    ).toBe('2');
  });
});
