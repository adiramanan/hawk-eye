import { editablePropertyDefinitions } from '../../packages/client/src/editable-properties';
import type {
  EditablePropertyId,
  ElementContext,
  PropertySnapshot,
  SelectionDraft,
  SizeControlState,
} from '../../packages/client/src/types';

// Realistic CSS values for a panel-like element
const SEED_VALUES: Partial<Record<string, string>> = {
  backgroundColor: '#1a1a1a',
  color: '#fcfcfc',
  fontSize: '12px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  fontWeight: '500',
  lineHeight: '1.5',
  letterSpacing: '0em',
  textAlign: 'left',
  paddingTop: '8px',
  paddingRight: '12px',
  paddingBottom: '8px',
  paddingLeft: '12px',
  marginTop: '0px',
  marginRight: '0px',
  marginBottom: '0px',
  marginLeft: '0px',
  borderRadius: '8px',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  borderBottomRightRadius: '8px',
  borderBottomLeftRadius: '8px',
  borderColor: '#595959',
  borderStyle: 'solid',
  borderTopWidth: '1px',
  borderRightWidth: '1px',
  borderBottomWidth: '1px',
  borderLeftWidth: '1px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  gap: '4px',
  width: '320px',
  height: 'auto',
  minWidth: '0px',
  maxWidth: 'none',
  minHeight: '0px',
  maxHeight: 'none',
  opacity: '1',
  positionType: 'relative',
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto',
  zIndex: 'auto',
  overflow: 'visible',
  cursor: 'default',
  boxShadow: 'none',
};

function makeSnapshot(id: string): PropertySnapshot {
  const value = SEED_VALUES[id] ?? '';
  return { baseline: value, inlineValue: value, inputValue: value, invalid: false, value };
}

const mockSizeControl: SizeControlState = {
  aspectRatio: null,
  aspectRatioLocked: false,
  heightMemory: { fixed: '792px', relative: '100%' },
  heightMode: { baseline: 'fixed', inlineValue: '792px', value: 'fixed' },
  widthMemory: { fixed: '320px', relative: '100%' },
  widthMode: { baseline: 'fixed', inlineValue: '320px', value: 'fixed' },
};

const mockContext: ElementContext = {
  tagName: 'div',
  isTextElement: false,
  hasDirectText: false,
  hasNonDefaultTypography: false,
  isReplaced: false,
  computedDisplay: 'block',
  parentDisplay: 'flex',
  supportsExplicitSizing: true,
};

export function mockSelectionDraft(): SelectionDraft {
  const properties = Object.fromEntries(
    editablePropertyDefinitions.map((def) => [def.id, makeSnapshot(def.id)])
  ) as Record<EditablePropertyId, PropertySnapshot>;

  return {
    // SelectionPayload
    source: 'packages/client/src/Inspector.tsx:142:12',
    file: 'packages/client/src/Inspector.tsx',
    line: 142,
    column: 12,
    saveCapability: null,
    saveEnabled: false,
    // SelectionDetails
    analysisFingerprint: 'mock-fp-001',
    instanceKey: 'mock-inspector-panel',
    classNames: [],
    classAttributeState: 'missing',
    classTargets: [],
    activeClassTargetId: null,
    inlineStyles: {},
    styleAttributeState: 'missing',
    styleAnalysisResolved: true,
    styleMode: 'inline',
    tagName: 'div',
    // SelectionDraft
    detached: false,
    properties,
    sizeControl: mockSizeControl,
    context: mockContext,
  };
}

export function makePropertySnapshot(id: string, value: string): PropertySnapshot {
  return { baseline: value, inlineValue: value, inputValue: value, invalid: false, value };
}

export { mockContext };
