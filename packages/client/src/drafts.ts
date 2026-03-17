import {
  FOCUSED_PROPERTY_IDS,
  editablePropertyDefinitionMap,
  editablePropertyDefinitions,
} from './editable-properties';
import {
  getSizeModeCssProperty,
  inferSizeMode,
  seedSizeModeMemory,
} from './size-state';
import type {
  EditablePropertyId,
  ElementContext,
  PropertySnapshot,
  SelectionDetails,
  SelectionDraft,
  SizeAxis,
  SizeControlState,
  SizeMode,
  SizeModeMetadataPayload,
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

function readSizeModeMetadataValue(element: HTMLElement, axis: SizeAxis) {
  return element.style.getPropertyValue(getSizeModeCssProperty(axis)).trim();
}

function restoreOriginalSizeMode(
  element: HTMLElement,
  axis: SizeAxis,
  sizeControl: SizeControlState
) {
  const cssProperty = getSizeModeCssProperty(axis);
  const snapshot = axis === 'width' ? sizeControl.widthMode : sizeControl.heightMode;

  if (snapshot.inlineValue) {
    element.style.setProperty(cssProperty, snapshot.inlineValue);
    return;
  }

  element.style.removeProperty(cssProperty);
}

function applySizeModeMetadata(
  element: HTMLElement,
  axis: SizeAxis,
  sizeControl: SizeControlState
) {
  const cssProperty = getSizeModeCssProperty(axis);
  const snapshot = axis === 'width' ? sizeControl.widthMode : sizeControl.heightMode;

  if (snapshot.value === snapshot.baseline && !snapshot.inlineValue) {
    element.style.removeProperty(cssProperty);
    return;
  }

  element.style.setProperty(cssProperty, snapshot.value);
}

function buildSizeControlState(element: HTMLElement, properties: SelectionDraft['properties']): SizeControlState {
  const rect = element.getBoundingClientRect();
  const widthInlineMode = readSizeModeMetadataValue(element, 'width');
  const heightInlineMode = readSizeModeMetadataValue(element, 'height');
  const widthBaselineMode = inferSizeMode('width', properties.width.baseline, widthInlineMode);
  const heightBaselineMode = inferSizeMode('height', properties.height.baseline, heightInlineMode);

  return {
    aspectRatio: null,
    aspectRatioLocked: false,
    heightMemory: seedSizeModeMemory('height', properties.height.baseline, rect.height),
    heightMode: {
      baseline: heightBaselineMode,
      inlineValue: heightInlineMode,
      value: heightBaselineMode,
    },
    widthMemory: seedSizeModeMemory('width', properties.width.baseline, rect.width),
    widthMode: {
      baseline: widthBaselineMode,
      inlineValue: widthInlineMode,
      value: widthBaselineMode,
    },
  };
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

function buildElementContext(element: HTMLElement): ElementContext {
  const TEXT_TAGS = new Set([
    'p','h1','h2','h3','h4','h5','h6','span','a','label','li','td','th',
    'caption','blockquote','cite','code','pre','em','strong','small','sub',
    'sup','dt','dd','figcaption','button'
  ]);
  const REPLACED_TAGS = new Set(['img','video','canvas','iframe','input','select','textarea']);

  const tagName = element.tagName.toLowerCase();
  const isTextElement = TEXT_TAGS.has(tagName);
  const isReplaced = REPLACED_TAGS.has(tagName);

  // Check for non-whitespace direct text children
  let hasDirectText = false;
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      hasDirectText = true;
      break;
    }
  }

  // Compare computed typography against body defaults
  let hasNonDefaultTypography = false;
  try {
    if (typeof window !== 'undefined' && document.body) {
      const computed = window.getComputedStyle(element);
      const bodyDefaults = window.getComputedStyle(document.body);
      const typographyProps = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign'] as const;
      hasNonDefaultTypography = typographyProps.some(p => computed[p] !== bodyDefaults[p]);
    }
  } catch {
    // Ignore errors from getComputedStyle (e.g., in jsdom with isolated contexts)
  }

  return { tagName, isTextElement, hasDirectText, hasNonDefaultTypography, isReplaced };
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

  const context = buildElementContext(element);

  return {
    ...details,
    detached: false,
    properties,
    sizeControl: buildSizeControlState(element, properties),
    context,
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
    sizeControl: draft.sizeControl,
    context: draft.context,
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

  applySizeModeMetadata(element, 'width', draft.sizeControl);
  applySizeModeMetadata(element, 'height', draft.sizeControl);
}

export function clearDraftOverrides(draft: SelectionDraft) {
  const element = getInspectableElementByKey(draft.instanceKey);

  if (!element) {
    return;
  }

  for (const definition of editablePropertyDefinitions) {
    restoreOriginalInlineValue(element, definition.id, draft.properties[definition.id]);
  }

  restoreOriginalSizeMode(element, 'width', draft.sizeControl);
  restoreOriginalSizeMode(element, 'height', draft.sizeControl);
}

export function applyDraftInputValue(
  element: HTMLElement,
  propertyId: EditablePropertyId,
  snapshot: PropertySnapshot,
  rawValue: string
): ApplyInputResult {
  const definition = editablePropertyDefinitionMap[propertyId];
  const isOpacitySlider = definition.control === 'slider' && definition.id === 'opacity';
  let candidate = isOpacitySlider ? clampOpacity(rawValue.trim()) : rawValue.trim();

  // Handle CSS value transforms (e.g., numeric input → repeat(), or spans)
  if (definition.cssTransform && candidate) {
    // Support templates like "span {value} / span {value}" or "repeat({value}, 1fr)"
    candidate = definition.cssTransform.replace('{value}', candidate);
  } else if ((propertyId === 'gridColumns' || propertyId === 'gridRows') && candidate) {
    // Legacy: grid columns/rows conversion (now should use cssTransform in definition)
    const num = parseInt(candidate, 10);
    if (!isNaN(num) && num > 0) {
      candidate = `repeat(${num}, 1fr)`;
    }
  }

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

  // Special case: "0" values might normalize to empty string in some browsers
  // If candidate looks like a valid "0" value (0, 0px, 0em, etc.) and normalization returned empty,
  // use the candidate as-is to ensure "0" values are accepted
  const isZeroValue = /^0(?:[a-z%]*)?$/.test(candidate);
  const finalValue = normalizedValue || (isZeroValue ? candidate : '');

  if (!finalValue) {
    return {
      baseline: snapshot.baseline,
      inlineValue: snapshot.inlineValue,
      invalid: true,
      inputValue: rawValue,
      value: snapshot.value,
    };
  }

  if (finalValue === snapshot.baseline) {
    restoreOriginalInlineValue(element, propertyId, snapshot);

    return {
      baseline: snapshot.baseline,
      inlineValue: snapshot.inlineValue,
      invalid: false,
      inputValue: finalValue,
      value: snapshot.baseline,
    };
  }

  element.style.setProperty(definition.cssProperty, finalValue);

  return {
    baseline: snapshot.baseline,
    inlineValue: snapshot.inlineValue,
    invalid: false,
    inputValue: finalValue,
    value: finalValue,
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

export function resetDraftSizeMode(
  element: HTMLElement | null,
  draft: SelectionDraft,
  axis: SizeAxis
) {
  if (element) {
    restoreOriginalSizeMode(element, axis, draft.sizeControl);
  }

  const snapshot = axis === 'width' ? draft.sizeControl.widthMode : draft.sizeControl.heightMode;

  return {
    ...snapshot,
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
    sizeControl: draft.sizeControl,
    styleMode: 'detached',
  };
}

export function hasDraftChanges(draft: SelectionDraft) {
  if (draft.detached) {
    return true;
  }

  return (
    editablePropertyDefinitions.some(
      (definition) =>
        draft.properties[definition.id].value !== draft.properties[definition.id].baseline
    ) ||
    draft.sizeControl.widthMode.value !== draft.sizeControl.widthMode.baseline ||
    draft.sizeControl.heightMode.value !== draft.sizeControl.heightMode.baseline
  );
}

export function getDirtySizeModes(draft: SelectionDraft): SizeModeMetadataPayload {
  const dirtyModes: SizeModeMetadataPayload = {};

  if (draft.sizeControl.widthMode.value !== draft.sizeControl.widthMode.baseline) {
    dirtyModes.width = draft.sizeControl.widthMode.value;
  }

  if (draft.sizeControl.heightMode.value !== draft.sizeControl.heightMode.baseline) {
    dirtyModes.height = draft.sizeControl.heightMode.value;
  }

  return dirtyModes;
}

export function getDraftSizeMode(draft: SelectionDraft, axis: SizeAxis): SizeMode {
  return axis === 'width' ? draft.sizeControl.widthMode.value : draft.sizeControl.heightMode.value;
}

export function getDraftSizeMemory(draft: SelectionDraft, axis: SizeAxis) {
  return axis === 'width' ? draft.sizeControl.widthMemory : draft.sizeControl.heightMemory;
}

export function isDraftSizeModeDirty(draft: SelectionDraft, axis: SizeAxis) {
  const snapshot = axis === 'width' ? draft.sizeControl.widthMode : draft.sizeControl.heightMode;
  return snapshot.value !== snapshot.baseline;
}

export function getDirtyPropertyIds(draft: SelectionDraft) {
  return editablePropertyDefinitions
    .filter(
      (definition) =>
        draft.properties[definition.id].value !== draft.properties[definition.id].baseline
    )
    .map((definition) => definition.id);
}

export function getDirtyDrafts(drafts: Record<string, SelectionDraft>) {
  return Object.values(drafts).filter(hasDraftChanges);
}
