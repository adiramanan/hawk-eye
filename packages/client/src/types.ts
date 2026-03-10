export interface InspectRequest {
  source: string;
}

export interface SelectionPayload {
  source: string;
  file: string;
  line: number;
  column: number;
}

export type StyleMode = 'inline' | 'tailwind' | 'unknown';

export interface SelectionDetails extends SelectionPayload {
  styleMode: StyleMode;
  tagName: string;
}

export interface MeasuredElement {
  element: HTMLElement;
  rect: DOMRect;
  source: string;
}

export type EditablePropertyId =
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'borderRadius'
  | 'backgroundColor'
  | 'color'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'opacity';

export type EditablePropertyGroupId = 'spacing' | 'radius' | 'color' | 'typography' | 'opacity';

export type EditablePropertyControl = 'text' | 'opacity';

export interface EditablePropertyDefinition {
  id: EditablePropertyId;
  label: string;
  shortLabel: string;
  cssProperty: string;
  group: EditablePropertyGroupId;
  control: EditablePropertyControl;
  placeholder: string;
}

export interface PropertySnapshot {
  baseline: string;
  inlineValue: string;
  inputValue: string;
  invalid: boolean;
  value: string;
}

export interface SelectionDraft extends SelectionDetails {
  properties: Record<EditablePropertyId, PropertySnapshot>;
}
