import type {
  ClassAttributeState,
  SelectionPayload,
  SizeMode,
  StyleAttributeState,
  StyleMode,
} from '../../../shared/protocol';
export type {
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
  | 'per-side';

export interface SelectOption {
  label: string;
  value: string;
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
  parentDisplay: string;            // parent element's computed display value (e.g. 'flex', 'grid', 'block')
}

export interface SelectionDraft extends SelectionDetails {
  styleAnalysisResolved: boolean;
  detached: boolean;
  properties: Record<EditablePropertyId, PropertySnapshot>;
  sizeControl: SizeControlState;
  context: ElementContext;
}
