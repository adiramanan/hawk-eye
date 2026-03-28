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
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../../../shared/protocol';
import type {
  AuthoredClassTarget,
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
const AUTHORED_SIZE_PROPERTY_IDS = new Set([
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
]);
const SIZE_KEYWORD_PROPERTY_IDS = new Set([
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
]);
const elementInstanceKeyCache = new WeakMap<
  HTMLElement,
  {
    key: string;
    source: string;
  }
>();
const previewStyleOverrideCache = new WeakMap<HTMLElement, Map<string, string | null>>();

function getActiveClassTarget(
  classTargets: AuthoredClassTarget[],
  activeClassTargetId: string | null
) {
  return (
    classTargets.find((target) => target.id === activeClassTargetId) ??
    classTargets[0] ??
    null
  );
}

function escapeAttributeValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function hasPreviewStyleOverride(element: HTMLElement, cssProperty: string) {
  return previewStyleOverrideCache.get(element)?.has(cssProperty) ?? false;
}

function setPreviewStyleOverride(
  element: HTMLElement,
  cssProperty: string,
  nextValue: string | null
) {
  let overrides = previewStyleOverrideCache.get(element);

  if (!overrides) {
    overrides = new Map<string, string | null>();
    previewStyleOverrideCache.set(element, overrides);
  }

  if (!overrides.has(cssProperty)) {
    overrides.set(cssProperty, element.style.getPropertyValue(cssProperty).trim() || null);
  }

  if (nextValue) {
    element.style.setProperty(cssProperty, nextValue);
    return;
  }

  element.style.removeProperty(cssProperty);
}

function restorePreviewStyleOverride(element: HTMLElement, cssProperty: string) {
  const overrides = previewStyleOverrideCache.get(element);

  if (!overrides?.has(cssProperty)) {
    return;
  }

  const originalValue = overrides.get(cssProperty) ?? null;

  if (originalValue) {
    element.style.setProperty(cssProperty, originalValue);
  } else {
    element.style.removeProperty(cssProperty);
  }

  overrides.delete(cssProperty);

  if (overrides.size === 0) {
    previewStyleOverrideCache.delete(element);
  }
}

function syncBackgroundFillPreview(element: HTMLElement, enabled: boolean) {
  if (!enabled) {
    restorePreviewStyleOverride(element, 'background-image');
    return;
  }

  const computedBackgroundImage = window.getComputedStyle(element).backgroundImage.trim();

  if (hasPreviewStyleOverride(element, 'background-image') || computedBackgroundImage !== 'none') {
    setPreviewStyleOverride(element, 'background-image', 'none');
    return;
  }

  restorePreviewStyleOverride(element, 'background-image');
}

function getInspectableElementsBySource(source: string) {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      `[${HAWK_EYE_SOURCE_ATTRIBUTE}="${escapeAttributeValue(source)}"]`
    )
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
  const trimmed = rawValue.trim().replace(/%$/, '').trim();
  const nextValue = Number.parseFloat(trimmed);

  if (!Number.isFinite(nextValue)) {
    return null;
  }

  const percent = Math.min(100, Math.max(1, nextValue));
  return String(Math.round(percent) / 100);
}

function isTransformInputValue(value: string) {
  return /^-?(?:\d+|\d*\.\d+)$/.test(value.trim());
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

function isFlexFillOnAxis(
  element: HTMLElement,
  axis: SizeAxis,
  properties: SelectionDraft['properties']
): boolean {
  const parent = element.parentElement;
  if (!parent) return false;

  const parentStyle = window.getComputedStyle(parent);
  const parentDisplay = parentStyle.display;
  if (parentDisplay !== 'flex' && parentDisplay !== 'inline-flex') return false;

  const parentDirection = parentStyle.flexDirection;
  const isMainAxis =
    (axis === 'width' && (parentDirection === 'row' || parentDirection === 'row-reverse')) ||
    (axis === 'height' && (parentDirection === 'column' || parentDirection === 'column-reverse'));

  if (isMainAxis) {
    // Main axis fill: flex-grow > 0
    const grow = parseFloat(properties.flexGrow?.baseline ?? '0');
    return grow > 0;
  }

  // Cross axis fill: align-self: stretch (or parent align-items: stretch with self: auto)
  const selfAlign = properties.alignSelf?.baseline ?? 'auto';
  if (selfAlign === 'stretch') return true;
  if (selfAlign === 'auto') {
    return parentStyle.alignItems === 'stretch';
  }

  return false;
}

function buildSizeControlState(element: HTMLElement, properties: SelectionDraft['properties']): SizeControlState {
  const rect = element.getBoundingClientRect();
  const widthInlineMode = readSizeModeMetadataValue(element, 'width');
  const heightInlineMode = readSizeModeMetadataValue(element, 'height');

  let widthBaselineMode = inferSizeMode('width', properties.width.baseline, widthInlineMode);
  let heightBaselineMode = inferSizeMode('height', properties.height.baseline, heightInlineMode);

  // Detect flex-based fill: if parent is flex and this child is growing/stretching,
  // report size mode as 'fill' even though width/height may be 'auto'
  try {
    if (widthBaselineMode === 'fixed' && isFlexFillOnAxis(element, 'width', properties)) {
      widthBaselineMode = 'fill';
    }
    if (heightBaselineMode === 'fixed' && isFlexFillOnAxis(element, 'height', properties)) {
      heightBaselineMode = 'fill';
    }
  } catch {
    // Ignore — getComputedStyle may fail in some environments
  }

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
  } else {
    element.style.removeProperty(definition.cssProperty);
  }

  if (propertyId === 'backgroundColor') {
    restorePreviewStyleOverride(element, 'background-image');
  }
}

function buildElementContext(element: HTMLElement): ElementContext {
  const TEXT_TAGS = new Set([
    'p','h1','h2','h3','h4','h5','h6','span','a','label','li','td','th',
    'caption','blockquote','cite','code','pre','em','strong','small','sub',
    'sup','dt','dd','figcaption','button'
  ]);
  const REPLACED_TAGS = new Set(['img','video','canvas','iframe','input','select','textarea']);
  const NON_SIZABLE_DISPLAYS = new Set([
    'contents',
    'inline',
    'table-column',
    'table-column-group',
    'table-footer-group',
    'table-header-group',
    'table-row',
    'table-row-group',
  ]);

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

  let computedDisplay = 'block';
  // Detect parent display for context-aware child property visibility
  let parentDisplay = 'block';
  try {
    if (typeof window !== 'undefined') {
      computedDisplay = window.getComputedStyle(element).display || 'block';

      if (element.parentElement) {
        parentDisplay = window.getComputedStyle(element.parentElement).display || 'block';
      }
    }
  } catch {
    // Ignore errors
  }

  const supportsExplicitSizing =
    isReplaced || !NON_SIZABLE_DISPLAYS.has(computedDisplay);

  return {
    tagName,
    isTextElement,
    hasDirectText,
    hasNonDefaultTypography,
    isReplaced,
    computedDisplay,
    supportsExplicitSizing,
    parentDisplay,
  };
}

function shouldPreserveNonNumericBaseline(propertyId: EditablePropertyId) {
  return SIZE_KEYWORD_PROPERTY_IDS.has(propertyId);
}

function buildAuthoredClassStyle(target: AuthoredClassTarget | null) {
  if (!target || Object.keys(target.declaredCssValues).length === 0) {
    return null;
  }

  const scratchElement = document.createElement('div');

  for (const [propertyName, value] of Object.entries(target.declaredCssValues)) {
    scratchElement.style.setProperty(propertyName, value);
  }

  return scratchElement.style;
}

function getAuthoredClassPropertyValue(
  propertyId: EditablePropertyId,
  cssProperty: string,
  authoredClassStyle: CSSStyleDeclaration | null
) {
  if (!authoredClassStyle) {
    return '';
  }

  if (propertyId === 'backgroundColor') {
    return (
      authoredClassStyle.getPropertyValue('background-color').trim() ||
      authoredClassStyle.getPropertyValue('background').trim()
    );
  }

  return authoredClassStyle.getPropertyValue(cssProperty).trim();
}

export function createSelectionDraft(
  details: SelectionDetails,
  element: HTMLElement
): SelectionDraft {
  const computedStyle = window.getComputedStyle(element);
  const classTargets = details.classTargets ?? [];
  const activeClassTargetId =
    details.activeClassTargetId &&
    classTargets.some((target) => target.id === details.activeClassTargetId)
      ? details.activeClassTargetId
      : classTargets[0]?.id ?? null;
  const activeClassTarget = details.styleAnalysisResolved
    ? getActiveClassTarget(classTargets, activeClassTargetId)
    : null;
  const authoredClassStyle = buildAuthoredClassStyle(activeClassTarget);
  const properties = {} as SelectionDraft['properties'];

  for (const definition of editablePropertyDefinitions) {
    const inlineValue = element.style.getPropertyValue(definition.cssProperty).trim();
    const computedValue = computedStyle.getPropertyValue(definition.cssProperty).trim();
    const authoredValue = getAuthoredClassPropertyValue(
      definition.id,
      definition.cssProperty,
      authoredClassStyle
    );
    const rawBaseline =
      authoredClassStyle
        ? authoredValue
        : AUTHORED_SIZE_PROPERTY_IDS.has(definition.id)
          ? inlineValue || computedValue
          : computedValue || inlineValue;
    const baseline =
      definition.control === 'number' &&
      !['gridColumns', 'gridRows'].includes(definition.id) &&
      !shouldPreserveNonNumericBaseline(definition.id) &&
      rawBaseline &&
      isNaN(parseFloat(rawBaseline))
        ? ''
        : rawBaseline;

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
    analysisFingerprint: details.analysisFingerprint,
    detached: false,
    activeClassTargetId,
    classTargets,
    properties,
    sizeControl: buildSizeControlState(element, properties),
    context,
    styleAnalysisResolved: details.styleAnalysisResolved,
  };
}

export function mergeSelectionDraft(
  draft: SelectionDraft,
  details: SelectionDetails
): SelectionDraft {
  const classTargets = details.classTargets ?? [];
  const activeClassTargetId =
    draft.activeClassTargetId &&
    classTargets.some((target) => target.id === draft.activeClassTargetId)
      ? draft.activeClassTargetId
      : classTargets[0]?.id ?? null;

  return {
    ...draft,
    source: details.source,
    detached: draft.detached,
    file: details.file,
    analysisFingerprint: details.analysisFingerprint,
    instanceKey: details.instanceKey,
    line: details.line,
    column: details.column,
    tagName: details.tagName,
    // Preserve the original detected strategy even after preview adds inline overrides.
    styleMode: draft.detached ? 'detached' : draft.styleMode,
    classNames: draft.classNames,
    classTargets,
    activeClassTargetId,
    inlineStyles: draft.inlineStyles,
    sizeControl: draft.sizeControl,
    context: draft.context,
    saveCapability: details.saveCapability,
    saveEnabled: details.saveEnabled,
    styleAnalysisResolved: details.styleAnalysisResolved,
  };
}

export function rebaseSelectionDraft(
  draft: SelectionDraft,
  details: SelectionDetails,
  element: HTMLElement
): SelectionDraft {
  const shouldPreserveResolvedClassContext =
    !details.styleAnalysisResolved &&
    details.classTargets.length === 0 &&
    draft.styleAnalysisResolved &&
    draft.classTargets.length > 0;
  const rebaseDetails = shouldPreserveResolvedClassContext
    ? {
        ...details,
        styleMode: draft.styleMode,
        styleAnalysisResolved: true,
        classNames: draft.classNames,
        classAttributeState: draft.classAttributeState,
        classTargets: draft.classTargets,
        activeClassTargetId:
          draft.activeClassTargetId &&
          draft.classTargets.some((target) => target.id === draft.activeClassTargetId)
            ? draft.activeClassTargetId
            : draft.classTargets[0]?.id ?? null,
        inlineStyles: draft.inlineStyles,
        styleAttributeState: draft.styleAttributeState,
      }
    : details;
  const rebasedDraft = createSelectionDraft(rebaseDetails, element);
  const properties = { ...rebasedDraft.properties };

  for (const definition of editablePropertyDefinitions) {
    const currentSnapshot = draft.properties[definition.id];

    if (currentSnapshot.value === currentSnapshot.baseline) {
      continue;
    }

    properties[definition.id] = {
      ...properties[definition.id],
      inputValue: currentSnapshot.inputValue,
      invalid: currentSnapshot.invalid,
      value: currentSnapshot.value,
    };
  }

  const widthModeDirty = draft.sizeControl.widthMode.value !== draft.sizeControl.widthMode.baseline;
  const heightModeDirty = draft.sizeControl.heightMode.value !== draft.sizeControl.heightMode.baseline;

  return {
    ...rebasedDraft,
    analysisFingerprint: details.analysisFingerprint,
    properties,
    saveCapability: details.saveCapability,
    saveEnabled: details.saveEnabled,
    styleAnalysisResolved: details.styleAnalysisResolved,
    sizeControl: {
      ...rebasedDraft.sizeControl,
      aspectRatio: draft.sizeControl.aspectRatio,
      aspectRatioLocked: draft.sizeControl.aspectRatioLocked,
      widthMemory: draft.sizeControl.widthMemory,
      heightMemory: draft.sizeControl.heightMemory,
      widthMode: widthModeDirty
        ? {
            ...rebasedDraft.sizeControl.widthMode,
            value: draft.sizeControl.widthMode.value,
          }
        : rebasedDraft.sizeControl.widthMode,
      heightMode: heightModeDirty
        ? {
            ...rebasedDraft.sizeControl.heightMode,
            value: draft.sizeControl.heightMode.value,
          }
        : rebasedDraft.sizeControl.heightMode,
    },
  };
}

export function createInspectableElementKey(element: HTMLElement) {
  if (typeof document === 'undefined') {
    return null;
  }

  const source = element.dataset.hawkEyeSource?.trim();

  if (!source) {
    return null;
  }

  const cachedEntry = elementInstanceKeyCache.get(element);

  if (cachedEntry?.source === source) {
    return cachedEntry.key;
  }

  const matches = getInspectableElementsBySource(source);
  const occurrence = matches.findIndex((match) => match === element);

  const instanceKey = `${source}${INSTANCE_KEY_SEPARATOR}${Math.max(occurrence, 0)}`;
  elementInstanceKeyCache.set(element, {
    key: instanceKey,
    source,
  });
  return instanceKey;
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

    if (definition.id === 'backgroundColor') {
      syncBackgroundFillPreview(element, true);
    }
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
  const isOpacityControl = definition.id === 'opacity';
  const trimmedRawValue = rawValue.trim();
  let candidate = isOpacityControl ? clampOpacity(trimmedRawValue) : trimmedRawValue;

  if (propertyId === 'display') {
    if (trimmedRawValue === 'block') {
      candidate = snapshot.baseline && snapshot.baseline !== 'none' ? snapshot.baseline : 'block';
    } else if (trimmedRawValue === 'none') {
      candidate = 'none';
    }
  }

  // Handle CSS value transforms (e.g., numeric input → repeat(), or spans)
  // Only transform plain numerals; already-valid CSS like "auto" or
  // "repeat(2, 1fr)" should pass through unchanged.
  if (definition.cssTransform && candidate && isTransformInputValue(candidate)) {
    // Support templates like "span {value} / span {value}" or "repeat({value}, 1fr)"
    candidate = definition.cssTransform.split('{value}').join(candidate);
  } else if (!definition.cssTransform && (propertyId === 'gridColumns' || propertyId === 'gridRows') && candidate) {
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

  if (propertyId === 'backgroundColor') {
    syncBackgroundFillPreview(element, true);
  }

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

    if (propertyId === 'backgroundColor') {
      restorePreviewStyleOverride(element, 'background-image');
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
