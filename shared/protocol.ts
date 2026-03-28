export const HAWK_EYE_SOURCE_ATTRIBUTE = 'data-hawk-eye-source';

export const HAWK_EYE_INSPECT_EVENT = 'hawk-eye:inspect';
export const HAWK_EYE_SELECTION_EVENT = 'hawk-eye:selection';
export const HAWK_EYE_ANALYZE_STYLE_EVENT = 'hawk-eye:analyze-style';
export const HAWK_EYE_STYLE_ANALYSIS_EVENT = 'hawk-eye:style-analysis';
export const HAWK_EYE_SAVE_EVENT = 'hawk-eye:save';
export const HAWK_EYE_SAVE_RESULT_EVENT = 'hawk-eye:save-result';

export type StyleMode = 'inline' | 'tailwind' | 'mixed' | 'detached' | 'unknown';
export type SaveCapability = string;
export type SizeMode = 'fixed' | 'hug' | 'fill' | 'relative';
export type ClassAttributeState = 'literal' | 'dynamic' | 'missing';
export type StyleAttributeState = 'object' | 'expression' | 'dynamic' | 'missing';

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

export interface AuthoredClassTarget {
  id: string;
  className: string;
  label: string;
  file: string;
  line: number;
  column: number;
  selector: string;
  fingerprint: string;
  declaredPropertyIds: string[];
  declaredCssValues: Record<string, string>;
}

export interface InspectRequest {
  clientId: string;
  source: string;
}

export interface SelectionPayload {
  source: string;
  file: string;
  line: number;
  column: number;
  saveCapability: SaveCapability | null;
  saveEnabled: boolean;
}

export interface StyleAnalysisPayload {
  source: string;
  mode: StyleMode;
  classNames: string[];
  inlineStyles: Record<string, string>;
  classAttributeState: ClassAttributeState;
  classTargets: AuthoredClassTarget[];
  styleAttributeState: StyleAttributeState;
  fingerprint: string;
  saveCapability: SaveCapability | null;
  saveEnabled: boolean;
}

export interface ClientPropertyMutation {
  propertyId: string;
  oldValue: string;
  newValue: string;
}

export interface SizeModeMetadata {
  width?: SizeMode;
  height?: SizeMode;
}

export interface ElementMutationRequest {
  file: string;
  line: number;
  column: number;
  detached: boolean;
  fingerprint: string;
  properties: ClientPropertyMutation[];
  sourceLocation?: SourceLocation;
  classTarget?: AuthoredClassTarget | null;
  sizeModeMetadata?: SizeModeMetadata;
}

export interface SavePayload {
  clientId: string;
  capability: SaveCapability;
  mutations: ElementMutationRequest[];
}

export type MutationWarningCode =
  | 'element-not-found'
  | 'file-not-found'
  | 'inline-fallback'
  | 'invalid-capability'
  | 'path-outside-root'
  | 'save-disabled'
  | 'stale-selection'
  | 'stale-class-target'
  | 'unsupported-dynamic-class'
  | 'unsupported-dynamic-style'
  | 'unsupported-tailwind-property';

export interface MutationWarning {
  code: MutationWarningCode;
  file: string;
  line: number;
  column: number;
  propertyId?: string;
  message: string;
}

export type SaveResult =
  | {
      success: true;
      modifiedFiles: string[];
      warnings: MutationWarning[];
    }
  | {
      success: false;
      error: string;
      warnings: MutationWarning[];
    };
