export interface InspectRequest {
  source: string;
}

export interface SelectionPayload {
  source: string;
  file: string;
  line: number;
  column: number;
}

export type StyleMode = 'inline' | 'tailwind' | 'mixed' | 'detached' | 'unknown';

export interface StyleAnalysisPayload {
  source: string;
  mode: StyleMode;
  classNames: string[];
  inlineStyles: Record<string, string>;
}

export interface PropertyMutationPayload {
  propertyId: EditablePropertyId;
  cssProperty: string;
  oldValue: string;
  newValue: string;
}

export interface ElementMutationPayload {
  file: string;
  line: number;
  column: number;
  styleMode: StyleMode;
  detached: boolean;
  properties: PropertyMutationPayload[];
}

export interface SavePayload {
  mutations: ElementMutationPayload[];
}

export interface MutationWarningPayload {
  code: string;
  file: string;
  line: number;
  column: number;
  propertyId?: string;
  message: string;
}

export type SaveResult =
  | {
      success: true;
      branch: string;
      commitSha: string;
      modifiedFiles: string[];
      warnings: MutationWarningPayload[];
    }
  | {
      success: false;
      error: string;
      branch?: string;
      warnings: MutationWarningPayload[];
    };

export interface SelectionDetails extends SelectionPayload {
  instanceKey: string;
  styleMode: StyleMode;
  tagName: string;
  classNames: string[];
  inlineStyles: Record<string, string>;
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
  // Auto Layout (Flexbox)
  | 'display'
  | 'flexDirection'
  | 'flexWrap'
  | 'justifyContent'
  | 'alignItems'
  | 'alignSelf'
  | 'gap'
  | 'rowGap'
  | 'columnGap'
  // Appearance
  | 'opacity'
  | 'borderRadius'
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomRightRadius'
  | 'borderBottomLeftRadius'
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
  // Typography
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'textAlign'
  | 'textDecoration'
  | 'textTransform'
  // Effects
  | 'boxShadow'
  | 'filter'
  | 'backdropFilter'
  // Advanced
  | 'cursor'
  | 'pointerEvents'
  | 'userSelect';

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
  | 'layout';

export type FocusedGroupId = 'layout' | 'fill' | 'typography' | 'design' | 'effects';

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
}

export interface PropertySnapshot {
  baseline: string;
  inlineValue: string;
  inputValue: string;
  invalid: boolean;
  value: string;
}

export interface SelectionDraft extends SelectionDetails {
  detached: boolean;
  properties: Record<EditablePropertyId, PropertySnapshot>;
}
