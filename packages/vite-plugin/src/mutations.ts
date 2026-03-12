import type { StyleMode } from './style-analyzer';

export interface PropertyMutation {
  propertyId: string;
  cssProperty: string;
  oldValue: string;
  newValue: string;
}

export interface ElementMutation {
  file: string;
  line: number;
  column: number;
  styleMode: StyleMode;
  detached: boolean;
  properties: PropertyMutation[];
}

export interface SavePayload {
  mutations: ElementMutation[];
}

export type MutationWarningCode =
  | 'element-not-found'
  | 'file-not-found'
  | 'inline-fallback'
  | 'path-outside-root'
  | 'unsupported-dynamic-class'
  | 'unsupported-dynamic-style';

export interface MutationWarning {
  code: MutationWarningCode;
  file: string;
  line: number;
  column: number;
  propertyId?: string;
  message: string;
}

export interface SourceWriteResult {
  appliedMutationCount: number;
  modifiedFiles: string[];
  warnings: MutationWarning[];
}
