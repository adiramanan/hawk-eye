import type {
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
  sizeModeMetadata?: SizeModeMetadata;
}

export interface SourceWriteResult {
  appliedMutationCount: number;
  modifiedFiles: string[];
  warnings: MutationWarning[];
}
