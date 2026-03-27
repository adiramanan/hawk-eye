import type {
  AuthoredClassTarget,
  ClassAttributeState,
  SelectionPayload,
  SizeMode,
  StyleAttributeState,
  StyleMode,
} from '../../../shared/protocol';
export type {
  AuthoredClassTarget,
  ClassAttributeState,
  ClientPropertyMutation as PropertyMutationPayload,
  ElementMutationRequest as ElementMutationPayload,
  InspectRequest,
  MutationWarning as MutationWarningPayload,
  SavePayload,
  SaveResult,
  SelectionPayload,
  SizeMode,
  SizeModeMetadata as SizeModeMetadataPayload,
  StyleAttributeState,
  StyleAnalysisPayload,
  StyleMode,
} from '../../../shared/protocol';

export interface SelectionDetails extends SelectionPayload {
  analysisFingerprint: string;
  instanceKey: string;
  classNames: string[];
  classAttributeState: ClassAttributeState;
  classTargets: AuthoredClassTarget[];
  activeClassTargetId: string | null;
  inlineStyles: Record<string, string>;
  saveCapability: string | null;
  saveEnabled: boolean;
  styleAttributeState: StyleAttributeState;
  styleAnalysisResolved: boolean;
  styleMode: StyleMode;
  tagName: string;
}

export interface MeasuredElement {
  element: HTMLElement;
  instanceKey: string;
  rect: DOMRect;
  source: string;
}

export type EditablePropertyId =
  // Spacing
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  // Size
  | 'width'
  | 'height'
  | 'minWidth'
  | 'maxWidth'
  | 'minHeight'
  | 'maxHeight'
  // Position
  | 'positionType'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'zIndex'
  // Auto Layout (Flexbox & Grid)
  | 'display'
  | 'flexDirection'
  | 'flexWrap'
  | 'justifyContent'
  | 'alignItems'
  | 'alignSelf'
  | 'gap'
  | 'rowGap'
  | 'columnGap'
  | 'gridColumns'
  | 'gridRows'
  | 'gridAutoFlow'
  | 'flexGrow'
  | 'flexShrink'
  | 'flexBasis'
  | 'columnSpan'
  | 'rowSpan'
  // Appearance
  | 'opacity'
  | 'borderRadius'
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomRightRadius'
  | 'borderBottomLeftRadius'
  | 'mixBlendMode'
  | 'overflow'
  | 'visibility'
  // Fill
  | 'backgroundColor'
  | 'backgroundImage'
  | 'color'
  // Stroke / Border
  | 'borderColor'
  | 'borderStyle'
  | 'borderTopWidth'
  | 'borderRightWidth'
  | 'borderBottomWidth'
  | 'borderLeftWidth'
  | 'strokeDasharray'
  // Typography
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'textAlign'
  | 'textDecoration'
  | 'textTransform'
  | 'textOverflow'
  | 'whiteSpace'
  | 'wordBreak'
  | 'overflowWrap'
  | 'lineClamp'
  // Effects
  | 'boxShadow'
  | 'filter'
  | 'backdropFilter'
  // Transition
  | 'transitionProperty'
  | 'transitionDuration'
  | 'transitionTimingFunction'
  | 'transitionDelay'
  // Advanced
  | 'cursor'
  | 'pointerEvents'
  | 'userSelect';

export type SizeAxis = 'width' | 'height';

export interface SizeModeSnapshot {
  baseline: SizeMode;
  inlineValue: string;
  value: SizeMode;
}

export interface SizeModeMemory {
  fixed: string;
  relative: string;
}

export interface SizeControlState {
  aspectRatio: number | null;
  aspectRatioLocked: boolean;
  heightMemory: SizeModeMemory;
  heightMode: SizeModeSnapshot;
  widthMemory: SizeModeMemory;
  widthMode: SizeModeSnapshot;
}

export type EditablePropertyGroupId =
  | 'position'
  | 'autoLayout'
  | 'size'
  | 'spacing'
  | 'appearance'
  | 'fill'
  | 'stroke'
  | 'typography'
  | 'effects'
  | 'transition'
  | 'layout';

export type FocusedGroupId =
  | 'positionSize'
  | 'autoLayout'
  | 'spacing'
  | 'fillOpacity'
  | 'border'
  | 'typography'
  | 'effects';

export type EditablePropertyControl =
  | 'text'
  | 'number'
  | 'slider'
  | 'color'
  | 'select'
  | 'segmented'
  | 'toggle'
  | 'per-side'
  | 'fill';

export interface SelectOption {
  label: string;
  value: string;
  hiddenInV1?: boolean;
}

export interface EditablePropertyDefinition {
  id: EditablePropertyId;
  label: string;
  shortLabel: string;
  cssProperty: string;
  group: EditablePropertyGroupId;
  control: EditablePropertyControl;
  placeholder: string;
  /** For 'select' and 'segmented' controls */
  options?: SelectOption[];
  /** For 'slider' and 'number' controls */
  min?: number;
  max?: number;
  step?: number;
  /** Unit options for numeric controls (e.g., ['px', 'rem', '%', 'auto']) */
  units?: string[];
  /** Default unit when none specified */
  defaultUnit?: string;
  /** For 'per-side' controls: the individual CSS properties */
  sides?: { top: string; right: string; bottom: string; left: string };
  /** Tailwind utility prefix for Phase 3 writer */
  tailwindPrefix?: string;
  /** CSS value template for complex transforms, e.g. 'span {value} / span {value}' */
  cssTransform?: string;
  /** Hide this property from the UI in v1 (defer to future versions) */
  hiddenInV1?: boolean;
}

export interface PropertySnapshot {
  baseline: string;
  inlineValue: string;
  inputValue: string;
  invalid: boolean;
  value: string;
}

export interface ElementContext {
  tagName: string;
  isTextElement: boolean;           // known text-bearing tag
  hasDirectText: boolean;           // non-whitespace direct text-node child
  hasNonDefaultTypography: boolean; // computed font/text CSS differs from body defaults
  isReplaced: boolean;              // img, video, canvas, iframe, input, select, textarea
  computedDisplay: string;          // element's computed display value
  supportsExplicitSizing: boolean;  // width/height meaningfully apply in current layout mode
  parentDisplay: string;            // parent element's computed display value (e.g. 'flex', 'grid', 'block')
}

export interface SelectionDraft extends SelectionDetails {
  styleAnalysisResolved: boolean;
  detached: boolean;
  properties: Record<EditablePropertyId, PropertySnapshot>;
  sizeControl: SizeControlState;
  context: ElementContext;
  classTargets: AuthoredClassTarget[];
  activeClassTargetId: string | null;
}

/**
 * V1 Properties: 34 core properties across 4 groups
 * Used to filter properties in PropertiesPanel and documentation
 */
export const V1_PROPERTIES: EditablePropertyId[] = [
  // Group 1: Size & Spacing
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  // Group 2: Appearance
  'display',
  'opacity', 'mixBlendMode',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomRightRadius', 'borderBottomLeftRadius',
  'backgroundColor',
  // Group 3: Type
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
  'textAlign', 'textDecoration', 'textTransform',
  'color',
  // Group 4: Stroke
  'borderColor', 'borderStyle',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'strokeDasharray',
];
