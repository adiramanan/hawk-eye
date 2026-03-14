import {
  FOCUSED_PROPERTY_IDS,
  editablePropertyDefinitionMap,
  editablePropertyDefinitions,
} from './editable-properties';
import type {
  EditablePropertyId,
  PropertySnapshot,
  SelectionDetails,
  SelectionDraft,
} from './types';

interface ApplyInputResult {
  baseline: string;
  inlineValue: string;
  invalid: boolean;
  inputValue: string;
  value: string;
}

const INSTANCE_KEY_SEPARATOR = '@@';

function escapeAttributeValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getInspectableElementsBySource(source: string) {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-source="${escapeAttributeValue(source)}"]`)
  );
}

function parseInspectableElementKey(instanceKey: string) {
  const separatorIndex = instanceKey.lastIndexOf(INSTANCE_KEY_SEPARATOR);

  if (separatorIndex === -1) {
    return {
      occurrence: 0,
      source: instanceKey,
    };
  }

  const source = instanceKey.slice(0, separatorIndex);
  const occurrence = Number.parseInt(
    instanceKey.slice(separatorIndex + INSTANCE_KEY_SEPARATOR.length),
    10
  );

  return {
    occurrence: Number.isInteger(occurrence) ? occurrence : 0,
    source,
  };
}

function clampOpacity(rawValue: string) {
  const nextValue = Number.parseFloat(rawValue);

  if (!Number.isFinite(nextValue)) {
    return null;
  }

  return String(Math.min(1, Math.max(0, Math.round(nextValue * 100) / 100)));
}

function restoreOriginalInlineValue(
  element: HTMLElement,
  propertyId: EditablePropertyId,
  snapshot: PropertySnapshot
) {
  const definition = editablePropertyDefinitionMap[propertyId];

  if (snapshot.inlineValue) {
    element.style.setProperty(definition.cssProperty, snapshot.inlineValue);
    return;
  }

  element.style.removeProperty(definition.cssProperty);
}

export function createSelectionDraft(
  details: SelectionDetails,
  element: HTMLElement
): SelectionDraft {
  const computedStyle = window.getComputedStyle(element);
  const properties = {} as SelectionDraft['properties'];

  for (const definition of editablePropertyDefinitions) {
    const baseline =
      computedStyle.getPropertyValue(definition.cssProperty).trim() ||
      element.style.getPropertyValue(definition.cssProperty).trim();
    const inlineValue = element.style.getPropertyValue(definition.cssProperty).trim();

    properties[definition.id] = {
      baseline,
      inlineValue,
      inputValue: baseline,
      invalid: false,
      value: baseline,
    };
  }

  return {
    ...details,
    detached: false,
    properties,
  };
}

export function mergeSelectionDraft(
  draft: SelectionDraft,
  details: SelectionDetails
): SelectionDraft {
  return {
    ...draft,
    detached: draft.detached,
    file: details.file,
    instanceKey: details.instanceKey,
    line: details.line,
    column: details.column,
    tagName: details.tagName,
    // Preserve the original detected strategy even after preview adds inline overrides.
    styleMode: draft.detached ? 'detached' : draft.styleMode,
    classNames: draft.classNames,
    inlineStyles: draft.inlineStyles,
  };
}

export function createInspectableElementKey(element: HTMLElement) {
  if (typeof document === 'undefined') {
    return null;
  }

  const source = element.dataset.source?.trim();

  if (!source) {
    return null;
  }

  const matches = getInspectableElementsBySource(source);
  const occurrence = matches.findIndex((match) => match === element);

  return `${source}${INSTANCE_KEY_SEPARATOR}${Math.max(occurrence, 0)}`;
}

export function getInspectableElementByKey(instanceKey: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const { source, occurrence } = parseInspectableElementKey(instanceKey);

  return getInspectableElementsBySource(source)[occurrence] ?? null;
}

export function applyDraftToElement(element: HTMLElement, draft: SelectionDraft) {
  for (const definition of editablePropertyDefinitions) {
    const snapshot = draft.properties[definition.id];
    const forceInline = draft.detached && FOCUSED_PROPERTY_IDS.has(definition.id);

    if (!forceInline && snapshot.value === snapshot.baseline) {
      restoreOriginalInlineValue(element, definition.id, snapshot);
      continue;
    }

    element.style.setProperty(definition.cssProperty, snapshot.value);
  }
}

export function clearDraftOverrides(draft: SelectionDraft) {
  const element = getInspectableElementByKey(draft.instanceKey);

  if (!element) {
    return;
  }

  for (const definition of editablePropertyDefinitions) {
    restoreOriginalInlineValue(element, definition.id, draft.properties[definition.id]);
  }
}

export function applyDraftInputValue(
  element: HTMLElement,
  propertyId: EditablePropertyId,
  snapshot: PropertySnapshot,
  rawValue: string
): ApplyInputResult {
  const definition = editablePropertyDefinitionMap[propertyId];
  const isOpacitySlider = definition.control === 'slider' && definition.id === 'opacity';
  const candidate = isOpacitySlider ? clampOpacity(rawValue.trim()) : rawValue.trim();

  if (!candidate) {
    return {
      baseline: snapshot.baseline,
      inlineValue: snapshot.inlineValue,
      invalid: true,
      inputValue: rawValue,
      value: snapshot.value,
    };
  }

  const scratchElement = document.createElement('div');
  scratchElement.style.setProperty(definition.cssProperty, candidate);
  const normalizedValue = scratchElement.style.getPropertyValue(definition.cssProperty).trim();

  if (!normalizedValue) {
    return {
      baseline: snapshot.baseline,
      inlineValue: snapshot.inlineValue,
      invalid: true,
      inputValue: rawValue,
      value: snapshot.value,
    };
  }

  if (normalizedValue === snapshot.baseline) {
    restoreOriginalInlineValue(element, propertyId, snapshot);

    return {
      baseline: snapshot.baseline,
      inlineValue: snapshot.inlineValue,
      invalid: false,
      inputValue: normalizedValue,
      value: snapshot.baseline,
    };
  }

  element.style.setProperty(definition.cssProperty, normalizedValue);

  return {
    baseline: snapshot.baseline,
    inlineValue: snapshot.inlineValue,
    invalid: false,
    inputValue: normalizedValue,
    value: normalizedValue,
  };
}

export function resetDraftProperty(
  element: HTMLElement | null,
  draft: SelectionDraft,
  propertyId: EditablePropertyId
) {
  const snapshot = draft.properties[propertyId];

  if (element) {
    if (draft.detached && FOCUSED_PROPERTY_IDS.has(propertyId)) {
      const definition = editablePropertyDefinitionMap[propertyId];
      element.style.setProperty(definition.cssProperty, snapshot.baseline);
    } else {
      restoreOriginalInlineValue(element, propertyId, snapshot);
    }
  }

  return {
    ...snapshot,
    inputValue: snapshot.baseline,
    invalid: false,
    value: snapshot.baseline,
  };
}

export function detachDraft(draft: SelectionDraft, element: HTMLElement): SelectionDraft {
  const computedStyle = window.getComputedStyle(element);
  const properties = { ...draft.properties };

  for (const definition of editablePropertyDefinitions) {
    if (!FOCUSED_PROPERTY_IDS.has(definition.id)) {
      continue;
    }

    const computedValue =
      computedStyle.getPropertyValue(definition.cssProperty).trim() ||
      element.style.getPropertyValue(definition.cssProperty).trim() ||
      draft.properties[definition.id].value;

    properties[definition.id] = {
      ...draft.properties[definition.id],
      inputValue: computedValue,
      invalid: false,
      value: computedValue,
    };
  }

  return {
    ...draft,
    detached: true,
    properties,
    styleMode: 'detached',
  };
}

export function hasDraftChanges(draft: SelectionDraft) {
  if (draft.detached) {
    return true;
  }

  return editablePropertyDefinitions.some(
    (definition) =>
      draft.properties[definition.id].value !== draft.properties[definition.id].baseline
  );
}

export function getDirtyDrafts(drafts: Record<string, SelectionDraft>) {
  return Object.values(drafts).filter(hasDraftChanges);
}

export function getDirtyPropertyIds(draft: SelectionDraft) {
  return editablePropertyDefinitions
    .filter(
      (definition) =>
        draft.properties[definition.id].value !== draft.properties[definition.id].baseline
    )
    .map((definition) => definition.id);
}
