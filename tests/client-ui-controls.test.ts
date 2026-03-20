// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../shared/protocol';
import { editablePropertyDefinitionMap, editablePropertyDefinitions } from '../packages/client/src/editable-properties';
import { GridTrackEditor } from '../packages/client/src/controls/GridTrackEditor';
import { NumberInput } from '../packages/client/src/controls/NumberInput';
import { SizeInput } from '../packages/client/src/controls/SizeInput';
import { applyDraftInputValue, createInspectableElementKey } from '../packages/client/src/drafts';
import { LayersPanel } from '../packages/client/src/LayersPanel';
import type { PropertySnapshot } from '../packages/client/src/types';

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
