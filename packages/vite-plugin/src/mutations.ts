import type {
  AuthoredClassTarget,
  MutationWarning,
  SizeModeMetadata,
  StyleMode,
} from '../../../shared/protocol';

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
  sourceLocation?: {
    file: string;
    line: number;
    column: number;
  };
  classTarget?: AuthoredClassTarget | null;
  sizeModeMetadata?: SizeModeMetadata;
}

export interface SourceWriteResult {
  appliedMutationCount: number;
  modifiedFiles: string[];
  warnings: MutationWarning[];
}
