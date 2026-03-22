import { type JSX, type ReactNode } from 'react';
import {
  ColorInput,
  GridTrackEditor,
  NumberInput,
  PerSideControl,
  SegmentedControl,
  SelectInput,
  SizeInput,
  SliderInput,
  TextInput,
} from './controls';
import {
  editablePropertyDefinitionMap,
  focusedGroupLabels,
} from './editable-properties';
import { getNextGroupIndex, isGroupNavigationKey } from './utils/keyboard-navigation';
import { parseCssValue } from './utils/css-value';
import type {
  EditablePropertyId,
  ElementContext,
  PropertySnapshot,
  SelectionDraft,
  SizeAxis,
  SizeMode,
} from './types';

// CollapsibleSection replaced by a static section — no collapse toggle
function CollapsibleSection({ title, sectionId, children }: { title: string; sectionId?: string; children: ReactNode; defaultExpanded?: boolean; key?: string }) {
  return (
    <section data-hawk-eye-section={sectionId} data-hawk-eye-ui="static-section">
      <div data-hawk-eye-ui="static-section-header">
        <h3 data-hawk-eye-ui="group-title">{title}</h3>
      </div>
      <div data-hawk-eye-ui="static-section-body">{children}</div>
    </section>
  );
}

interface PropertiesPanelProps {
  pendingDrafts: SelectionDraft[];
  selectedDraft: SelectionDraft;
  context: ElementContext;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onChangeSizeMode(axis: SizeAxis, mode: SizeMode): void;
  onChangeSizeValue(axis: SizeAxis, value: string): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onToggleAspectRatioLock(): void;
}

function AspectRatioLockIcon({ locked }: { locked: boolean }) {
  const path = locked
    ? 'M11.4583 6.45833V4.79167C11.4583 2.49048 9.59285 0.625 7.29167 0.625C4.99048 0.625 3.125 2.49048 3.125 4.79167V6.45833M7.29167 10.2083V11.875M4.625 15.625H9.95833C11.3585 15.625 12.0585 15.625 12.5933 15.3525C13.0637 15.1128 13.4462 14.7304 13.6858 14.26C13.9583 13.7252 13.9583 13.0251 13.9583 11.625V10.4583C13.9583 9.0582 13.9583 8.35814 13.6858 7.82336C13.4462 7.35295 13.0637 6.9705 12.5933 6.73082C12.0585 6.45833 11.3585 6.45833 9.95833 6.45833H4.625C3.22487 6.45833 2.5248 6.45833 1.99002 6.73082C1.51962 6.9705 1.13717 7.35295 0.897484 7.82336C0.625 8.35814 0.625 9.0582 0.625 10.4583V11.625C0.625 13.0251 0.625 13.7252 0.897484 14.26C1.13717 14.7304 1.51962 15.1128 1.99002 15.3525C2.5248 15.625 3.22487 15.625 4.625 15.625Z'
    : 'M3.125 6.45833V4.79167C3.125 2.49048 4.99048 0.625 7.29167 0.625C9.00027 0.625 10.4687 1.65341 11.1116 3.125M7.29167 10.2083V11.875M4.625 15.625H9.95833C11.3585 15.625 12.0585 15.625 12.5933 15.3525C13.0637 15.1128 13.4462 14.7304 13.6858 14.26C13.9583 13.7252 13.9583 13.0251 13.9583 11.625V10.4583C13.9583 9.0582 13.9583 8.35814 13.6858 7.82336C13.4462 7.35295 13.0637 6.9705 12.5933 6.73082C12.0585 6.45833 11.3585 6.45833 9.95833 6.45833H4.625C3.22487 6.45833 2.5248 6.45833 1.99002 6.73082C1.51962 6.9705 1.13717 7.35295 0.897484 7.82336C0.625 8.35814 0.625 9.0582 0.625 10.4583V11.625C0.625 13.0251 0.625 13.7252 0.897484 14.26C1.13717 14.7304 1.51962 15.1128 1.99002 15.3525C2.5248 15.625 3.22487 15.625 4.625 15.625Z';

  return (
    <span aria-hidden="true" data-hawk-eye-ui="aspect-ratio-lock-icon">
      <svg
        fill="none"
        viewBox="0 0 14.5833 16.25"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={path}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.25"
        />
      </svg>
    </span>
  );
}

// ── Property card helpers ──────────────────────────────────────────────────

interface CompactCardProps {
  propertyId: EditablePropertyId;
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  scrubLabel?: string;
}

function CompactCard({
  propertyId,
  selectedDraft,
  onChange,
  onResetProperty,
  scrubLabel,
}: CompactCardProps) {
  const definition = editablePropertyDefinitionMap[propertyId];
  const snapshot = selectedDraft.properties[propertyId];
  const dirty = snapshot.value !== snapshot.baseline;

  let control: ReactNode;
  if (definition.control === 'number') {
    control = (
      <NumberInput
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        scrubLabel={scrubLabel}
        snapshot={snapshot}
      />
    );
  } else if (definition.control === 'color') {
    control = (
      <ColorInput
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        snapshot={snapshot}
      />
    );
  } else if (definition.control === 'select') {
    control = (
      <SelectInput
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        snapshot={snapshot}
      />
    );
  } else if (definition.control === 'segmented') {
    control = (
      <SegmentedControl
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        snapshot={snapshot}
      />
    );
  } else if (definition.control === 'slider') {
    control = (
      <SliderInput
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        snapshot={snapshot}
      />
    );
  } else {
    control = (
      <TextInput
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        snapshot={snapshot}
      />
    );
  }

  return (
    <div
      data-dirty={dirty ? 'true' : 'false'}
      data-hawk-eye-ui="compact-card"
      data-invalid={snapshot.invalid ? 'true' : 'false'}
      data-property-id={propertyId}
    >
      {control}
      {dirty && (
        <button
          aria-label={`Reset ${definition.label}`}
          data-hawk-eye-ui="control-reset-mini"
          onClick={() => onResetProperty(selectedDraft.instanceKey, propertyId)}
          type="button"
        >
          ↺
        </button>
      )}
    </div>
  );
}

interface PerSideCardProps {
  cardId: string;
  label: string;
  propertyIds: { top: EditablePropertyId; right: EditablePropertyId; bottom: EditablePropertyId; left: EditablePropertyId };
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
}

function PerSideCard({
  cardId,
  label,
  propertyIds,
  selectedDraft,
  onChange,
  onResetProperty,
}: PerSideCardProps) {
  const entries = [
    { id: propertyIds.top, snapshot: selectedDraft.properties[propertyIds.top] },
    { id: propertyIds.right, snapshot: selectedDraft.properties[propertyIds.right] },
    { id: propertyIds.bottom, snapshot: selectedDraft.properties[propertyIds.bottom] },
    { id: propertyIds.left, snapshot: selectedDraft.properties[propertyIds.left] },
  ];
  const dirtyEntries = entries.filter((e) => e.snapshot.value !== e.snapshot.baseline);

  return (
    <div
      data-dirty={dirtyEntries.length > 0 ? 'true' : 'false'}
      data-hawk-eye-ui="per-side-wrap"
      data-property-id={cardId}
    >
      <PerSideControl
        key={`${selectedDraft.instanceKey}-${cardId}`}
        label={label}
        onChange={onChange}
        onReset={(propertyId) => onResetProperty(selectedDraft.instanceKey, propertyId)}
        sides={{
          top: { id: propertyIds.top, snapshot: selectedDraft.properties[propertyIds.top] },
          right: { id: propertyIds.right, snapshot: selectedDraft.properties[propertyIds.right] },
          bottom: { id: propertyIds.bottom, snapshot: selectedDraft.properties[propertyIds.bottom] },
          left: { id: propertyIds.left, snapshot: selectedDraft.properties[propertyIds.left] },
        }}
      />
    </div>
  );
}

// ── Section renderers ──────────────────────────────────────────────────────

interface SectionProps {
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onChangeSizeMode(axis: SizeAxis, mode: SizeMode): void;
  onChangeSizeValue(axis: SizeAxis, value: string): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onToggleAspectRatioLock(): void;
}

const TEXT_ONLY_APPEARANCE_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'span',
  'a',
  'label',
  'caption',
  'blockquote',
  'cite',
  'code',
  'pre',
  'em',
  'strong',
  'small',
  'sub',
  'sup',
  'dt',
  'dd',
  'figcaption',
]);

function shouldShowAppearanceFill(context: ElementContext) {
  return !TEXT_ONLY_APPEARANCE_TAGS.has(context.tagName);
}

const BORDER_WIDTH_PROPERTY_IDS = [
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
] as const satisfies readonly EditablePropertyId[];

function getSnapshotDisplayValue(snapshot: PropertySnapshot) {
  return snapshot.inputValue || snapshot.value || snapshot.baseline;
}

function isVisibleBorderStyle(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'none' && trimmed !== 'hidden';
}

function getBorderWidth(snapshot: PropertySnapshot) {
  const parsed = parseCssValue(getSnapshotDisplayValue(snapshot).trim());

  if (parsed) {
    return parsed.number;
  }

  const numericValue = Number.parseFloat(getSnapshotDisplayValue(snapshot).trim());
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function hasAnyBorderWidth(selectedDraft: SelectionDraft) {
  return BORDER_WIDTH_PROPERTY_IDS.some(
    (propertyId) => getBorderWidth(selectedDraft.properties[propertyId]) > 0
  );
}

function isBorderWidthPropertyId(
  propertyId: EditablePropertyId
): propertyId is (typeof BORDER_WIDTH_PROPERTY_IDS)[number] {
  return BORDER_WIDTH_PROPERTY_IDS.includes(
    propertyId as (typeof BORDER_WIDTH_PROPERTY_IDS)[number]
  );
}

function card(
  propertyId: EditablePropertyId,
  props: SectionProps,
  scrubLabel?: string
) {
  return (
    <CompactCard
      key={propertyId}
      onChange={props.onChange}
      onResetProperty={props.onResetProperty}
      propertyId={propertyId}
      scrubLabel={scrubLabel}
      selectedDraft={props.selectedDraft}
    />
  );
}

// ── Layout mode icon options ─────────────────────────────────────────────

const LAYOUT_MODE_OPTIONS: Array<{ value: string; label: string; icon: JSX.Element }> = [
  {
    value: 'block',
    label: 'Block',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.66667 8C6.66667 7.53329 6.66667 7.29993 6.75749 7.12167C6.83739 6.96487 6.96487 6.83739 7.12167 6.75749C7.29993 6.66667 7.53329 6.66667 8 6.66667H12C12.4667 6.66667 12.7001 6.66667 12.8783 6.75749C13.0351 6.83739 13.1626 6.96487 13.2425 7.12167C13.3333 7.29993 13.3333 7.53329 13.3333 8V12C13.3333 12.4667 13.3333 12.7001 13.2425 12.8783C13.1626 13.0351 13.0351 13.1626 12.8783 13.2425C12.7001 13.3333 12.4667 13.3333 12 13.3333H8C7.53329 13.3333 7.29993 13.3333 7.12167 13.2425C6.96487 13.1626 6.83739 13.0351 6.75749 12.8783C6.66667 12.7001 6.66667 12.4667 6.66667 12V8Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'column',
    label: 'Vertical Stack',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.33331 15V5C8.33331 4.22343 8.33331 3.83515 8.20645 3.52886C8.03729 3.12048 7.71283 2.79602 7.30445 2.62687C6.99817 2.5 6.60988 2.5 5.83331 2.5C5.05674 2.5 4.66846 2.5 4.36217 2.62687C3.95379 2.79602 3.62934 3.12048 3.46018 3.52886C3.33331 3.83515 3.33331 4.22343 3.33331 5V15C3.33331 15.7766 3.33331 16.1649 3.46018 16.4711C3.62934 16.8795 3.95379 17.204 4.36217 17.3731C4.66846 17.5 5.05674 17.5 5.83331 17.5C6.60988 17.5 6.99817 17.5 7.30445 17.3731C7.71283 17.204 8.03729 16.8795 8.20645 16.4711C8.33331 16.1649 8.33331 15.7766 8.33331 15Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.6666 11.6667V5C16.6666 4.22343 16.6666 3.83515 16.5398 3.52886C16.3706 3.12048 16.0462 2.79602 15.6378 2.62687C15.3315 2.5 14.9432 2.5 14.1666 2.5C13.3901 2.5 13.0018 2.5 12.6955 2.62687C12.2871 2.79602 11.9627 3.12048 11.7935 3.52886C11.6666 3.83515 11.6666 4.22343 11.6666 5V11.6667C11.6666 12.4432 11.6666 12.8315 11.7935 13.1378C11.9627 13.5462 12.2871 13.8706 12.6955 14.0398C13.0018 14.1667 13.3901 14.1667 14.1666 14.1667C14.9432 14.1667 15.3315 14.1667 15.6378 14.0398C16.0462 13.8706 16.3706 13.5462 16.5398 13.1378C16.6666 12.8315 16.6666 12.4432 16.6666 11.6667Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'stack',
    label: 'Horizontal Stack',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.6667 8.3335C12.4432 8.3335 12.8315 8.3335 13.1378 8.20663C13.5462 8.03747 13.8706 7.71301 14.0398 7.30463C14.1667 6.99835 14.1667 6.61007 14.1667 5.8335C14.1667 5.05693 14.1667 4.66864 14.0398 4.36236C13.8706 3.95398 13.5462 3.62952 13.1378 3.46036C12.8315 3.3335 12.4432 3.3335 11.6667 3.3335L5 3.3335C4.22343 3.3335 3.83515 3.3335 3.52886 3.46036C3.12048 3.62952 2.79602 3.95398 2.62687 4.36236C2.5 4.66864 2.5 5.05693 2.5 5.8335C2.5 6.61006 2.5 6.99835 2.62687 7.30463C2.79602 7.71301 3.12048 8.03747 3.52886 8.20663C3.83515 8.3335 4.22343 8.3335 5 8.3335L11.6667 8.3335Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 16.6668C15.7766 16.6668 16.1649 16.6668 16.4711 16.54C16.8795 16.3708 17.204 16.0463 17.3731 15.638C17.5 15.3317 17.5 14.9434 17.5 14.1668C17.5 13.3903 17.5 13.002 17.3731 12.6957C17.204 12.2873 16.8795 11.9629 16.4711 11.7937C16.1649 11.6668 15.7766 11.6668 15 11.6668H5C4.22343 11.6668 3.83515 11.6668 3.52886 11.7937C3.12048 11.9629 2.79602 12.2873 2.62687 12.6957C2.5 13.002 2.5 13.3903 2.5 14.1668C2.5 14.9434 2.5 15.3317 2.62687 15.638C2.79602 16.0463 3.12048 16.3708 3.52886 16.54C3.83515 16.6668 4.22343 16.6668 5 16.6668L15 16.6668Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'grid',
    label: 'Grid',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2.5H3.83333C3.36662 2.5 3.13327 2.5 2.95501 2.59083C2.79821 2.67072 2.67072 2.79821 2.59083 2.95501C2.5 3.13327 2.5 3.36662 2.5 3.83333V7C2.5 7.46671 2.5 7.70007 2.59083 7.87833C2.67072 8.03513 2.79821 8.16261 2.95501 8.24251C3.13327 8.33333 3.36662 8.33333 3.83333 8.33333H7C7.46671 8.33333 7.70007 8.33333 7.87833 8.24251C8.03513 8.16261 8.16261 8.03513 8.24251 7.87833C8.33333 7.70007 8.33333 7.46671 8.33333 7V3.83333C8.33333 3.36662 8.33333 3.13327 8.24251 2.95501C8.16261 2.79821 8.03513 2.67072 7.87833 2.59083C7.70007 2.5 7.46671 2.5 7 2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.1667 2.5H13C12.5333 2.5 12.2999 2.5 12.1217 2.59083C11.9649 2.67072 11.8374 2.79821 11.7575 2.95501C11.6667 3.13327 11.6667 3.36662 11.6667 3.83333V7C11.6667 7.46671 11.6667 7.70007 11.7575 7.87833C11.8374 8.03513 11.9649 8.16261 12.1217 8.24251C12.2999 8.33333 12.5333 8.33333 13 8.33333H16.1667C16.6334 8.33333 16.8667 8.33333 17.045 8.24251C17.2018 8.16261 17.3293 8.03513 17.4092 7.87833C17.5 7.70007 17.5 7.46671 17.5 7V3.83333C17.5 3.36662 17.5 3.13327 17.4092 2.95501C17.3293 2.79821 17.2018 2.67072 17.045 2.59083C16.8667 2.5 16.6334 2.5 16.1667 2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.1667 11.6667H13C12.5333 11.6667 12.2999 11.6667 12.1217 11.7575C11.9649 11.8374 11.8374 11.9649 11.7575 12.1217C11.6667 12.2999 11.6667 12.5333 11.6667 13V16.1667C11.6667 16.6334 11.6667 16.8667 11.7575 17.045C11.8374 17.2018 11.9649 17.3293 12.1217 17.4092C12.2999 17.5 12.5333 17.5 13 17.5H16.1667C16.6334 17.5 16.8667 17.5 17.045 17.4092C17.2018 17.3293 17.3293 17.2018 17.4092 17.045C17.5 16.8667 17.5 16.6334 17.5 16.1667V13C17.5 12.5333 17.5 12.2999 17.4092 12.1217C17.3293 11.9649 17.2018 11.8374 17.045 11.7575C16.8667 11.6667 16.6334 11.6667 16.1667 11.6667Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 11.6667H3.83333C3.36662 11.6667 3.13327 11.6667 2.95501 11.7575C2.79821 11.8374 2.67072 11.9649 2.59083 12.1217C2.5 12.2999 2.5 12.5333 2.5 13V16.1667C2.5 16.6334 2.5 16.8667 2.59083 17.045C2.67072 17.2018 2.79821 17.3293 2.95501 17.4092C3.13327 17.5 3.36662 17.5 3.83333 17.5H7C7.46671 17.5 7.70007 17.5 7.87833 17.4092C8.03513 17.3293 8.16261 17.2018 8.24251 17.045C8.33333 16.8667 8.33333 16.6334 8.33333 16.1667V13C8.33333 12.5333 8.33333 12.2999 8.24251 12.1217C8.16261 11.9649 8.03513 11.8374 7.87833 11.7575C7.70007 11.6667 7.46671 11.6667 7 11.6667Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'none',
    label: 'Hidden',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 7.5L12.5 12.5M12.5 7.5L7.5 12.5M6.5 17.5H13.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V13.5C2.5 14.9001 2.5 15.6002 2.77248 16.135C3.01217 16.6054 3.39462 16.9878 3.86502 17.2275C4.3998 17.5 5.09987 17.5 6.5 17.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ── Alignment icon options ──────────────────────────────────────────────

const X_AXIS_OPTIONS: Array<{ value: string; label: string; icon: JSX.Element }> = [
  {
    value: 'flex-start',
    label: 'Align Left',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M7 7h9M7 10h6M7 13h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'center',
    label: 'Align Center',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M5 7h10M6 10h8M5.5 13h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'flex-end',
    label: 'Align Right',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M4 7h9M7 10h6M5 13h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
];

const Y_AXIS_OPTIONS: Array<{ value: string; label: string; icon: JSX.Element }> = [
  {
    value: 'flex-start',
    label: 'Align Top',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M7 7v9M10 7v6M13 7v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'center',
    label: 'Align Middle',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M7 5v10M10 6v8M13 5.5v9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'flex-end',
    label: 'Align Bottom',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M7 4v9M10 7v6M13 5v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
];

// ── Layout Section ───────────────────────────────────────────────────────

function LayoutSection(props: SectionProps) {
  const displayValue = props.selectedDraft.properties.display?.value ?? '';
  const flexDirection = props.selectedDraft.properties.flexDirection?.value ?? '';
  const isFlex = displayValue === 'flex' || displayValue === 'inline-flex';
  const isGrid = displayValue === 'grid';
  const isNone = displayValue === 'none';
  const isRow = isFlex && flexDirection !== 'column';
  const isColumn = isFlex && flexDirection === 'column';
  const parentDisplay = props.selectedDraft.context.parentDisplay;
  const parentIsGrid = parentDisplay === 'grid' || parentDisplay === 'inline-grid';

  // Determine layout mode from display + flex-direction
  let layoutMode = 'block';
  if (isNone) {
    layoutMode = 'none';
  } else if (isColumn) {
    layoutMode = 'column';
  } else if (isFlex) {
    layoutMode = 'stack';
  } else if (isGrid) {
    layoutMode = 'grid';
  }

  const handleLayoutModeChange = (value: string) => {
    if (value === 'stack') {
      props.onChange('display', 'flex');
      props.onChange('flexDirection', 'row');
    } else if (value === 'column') {
      props.onChange('display', 'flex');
      props.onChange('flexDirection', 'column');
    } else if (value === 'grid') {
      props.onChange('display', 'grid');
    } else if (value === 'none') {
      props.onChange('display', 'none');
    } else {
      props.onChange('display', 'block');
    }
  };

  // Determine which CSS property maps to X-Axis vs Y-Axis based on flex direction
  // Row: X = justifyContent, Y = alignItems
  // Column: X = alignItems, Y = justifyContent
  const xAxisProp = isColumn ? 'alignItems' : 'justifyContent';
  const yAxisProp = isColumn ? 'justifyContent' : 'alignItems';
  const xAxisValue = props.selectedDraft.properties[xAxisProp]?.value ?? 'flex-start';
  const yAxisValue = props.selectedDraft.properties[yAxisProp]?.value ?? 'flex-start';

  return (
    <CollapsibleSection
      defaultExpanded
      key="layout"
      sectionId="autoLayout"
      title={focusedGroupLabels.autoLayout}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Layout Mode Icon Selector */}
        <div data-hawk-eye-ui="icon-segmented">
          {LAYOUT_MODE_OPTIONS.map(({ value, label, icon }, index) => (
            <button
              aria-label={`Layout mode: ${label}`}
              aria-pressed={layoutMode === value}
              data-active={layoutMode === value ? 'true' : 'false'}
              data-hawk-eye-control={`layout-${value}`}
              data-hawk-eye-ui="icon-seg-btn"
              key={value}
              onKeyDown={(event) => {
                if (!isGroupNavigationKey(event.key)) return;
                event.preventDefault();
                const nextIndex = getNextGroupIndex(event.key, index, LAYOUT_MODE_OPTIONS.length);
                const nextOption = LAYOUT_MODE_OPTIONS[nextIndex];
                if (!nextOption) return;
                handleLayoutModeChange(nextOption.value);
                const buttons = event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>('button');
                buttons?.[nextIndex]?.focus();
              }}
              onClick={() => handleLayoutModeChange(value)}
              title={label}
              type="button"
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Flex Column (Vertical Stack) — Row Gap + Alignment */}
        {isColumn && (
          <>
            <div data-hawk-eye-ui="labelled-single">
              <span data-hawk-eye-ui="input-label">Row Gap</span>
              {card('rowGap', props)}
            </div>
            <div data-hawk-eye-ui="labelled-row">
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">X-Axis</span>
                <div data-hawk-eye-ui="icon-segmented">
                  {X_AXIS_OPTIONS.map(({ value, label, icon }, index) => (
                    <button
                      aria-label={`Horizontal alignment: ${label}`}
                      aria-pressed={xAxisValue === value}
                      data-active={xAxisValue === value ? 'true' : 'false'}
                      data-hawk-eye-ui="icon-seg-btn"
                      key={value}
                      onKeyDown={(event) => {
                        if (!isGroupNavigationKey(event.key)) return;
                        event.preventDefault();
                        const nextIndex = getNextGroupIndex(event.key, index, X_AXIS_OPTIONS.length);
                        const nextOpt = X_AXIS_OPTIONS[nextIndex];
                        if (!nextOpt) return;
                        props.onChange(xAxisProp as EditablePropertyId, nextOpt.value);
                        const buttons = event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>('button');
                        buttons?.[nextIndex]?.focus();
                      }}
                      onClick={() => props.onChange(xAxisProp as EditablePropertyId, value)}
                      title={label}
                      type="button"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Y-Axis</span>
                <div data-hawk-eye-ui="icon-segmented">
                  {Y_AXIS_OPTIONS.map(({ value, label, icon }, index) => (
                    <button
                      aria-label={`Vertical alignment: ${label}`}
                      aria-pressed={yAxisValue === value}
                      data-active={yAxisValue === value ? 'true' : 'false'}
                      data-hawk-eye-ui="icon-seg-btn"
                      key={value}
                      onKeyDown={(event) => {
                        if (!isGroupNavigationKey(event.key)) return;
                        event.preventDefault();
                        const nextIndex = getNextGroupIndex(event.key, index, Y_AXIS_OPTIONS.length);
                        const nextOpt = Y_AXIS_OPTIONS[nextIndex];
                        if (!nextOpt) return;
                        props.onChange(yAxisProp as EditablePropertyId, nextOpt.value);
                        const buttons = event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>('button');
                        buttons?.[nextIndex]?.focus();
                      }}
                      onClick={() => props.onChange(yAxisProp as EditablePropertyId, value)}
                      title={label}
                      type="button"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Flex Row (Horizontal Stack) — Column Gap + Alignment */}
        {isRow && (
          <>
            <div data-hawk-eye-ui="labelled-single">
              <span data-hawk-eye-ui="input-label">Column Gap</span>
              {card('columnGap', props)}
            </div>
            <div data-hawk-eye-ui="labelled-row">
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">X-Axis</span>
                <div data-hawk-eye-ui="icon-segmented">
                  {X_AXIS_OPTIONS.map(({ value, label, icon }, index) => (
                    <button
                      aria-label={`Horizontal alignment: ${label}`}
                      aria-pressed={xAxisValue === value}
                      data-active={xAxisValue === value ? 'true' : 'false'}
                      data-hawk-eye-ui="icon-seg-btn"
                      key={value}
                      onKeyDown={(event) => {
                        if (!isGroupNavigationKey(event.key)) return;
                        event.preventDefault();
                        const nextIndex = getNextGroupIndex(event.key, index, X_AXIS_OPTIONS.length);
                        const nextOpt = X_AXIS_OPTIONS[nextIndex];
                        if (!nextOpt) return;
                        props.onChange(xAxisProp as EditablePropertyId, nextOpt.value);
                        const buttons = event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>('button');
                        buttons?.[nextIndex]?.focus();
                      }}
                      onClick={() => props.onChange(xAxisProp as EditablePropertyId, value)}
                      title={label}
                      type="button"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Y-Axis</span>
                <div data-hawk-eye-ui="icon-segmented">
                  {Y_AXIS_OPTIONS.map(({ value, label, icon }, index) => (
                    <button
                      aria-label={`Vertical alignment: ${label}`}
                      aria-pressed={yAxisValue === value}
                      data-active={yAxisValue === value ? 'true' : 'false'}
                      data-hawk-eye-ui="icon-seg-btn"
                      key={value}
                      onKeyDown={(event) => {
                        if (!isGroupNavigationKey(event.key)) return;
                        event.preventDefault();
                        const nextIndex = getNextGroupIndex(event.key, index, Y_AXIS_OPTIONS.length);
                        const nextOpt = Y_AXIS_OPTIONS[nextIndex];
                        if (!nextOpt) return;
                        props.onChange(yAxisProp as EditablePropertyId, nextOpt.value);
                        const buttons = event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>('button');
                        buttons?.[nextIndex]?.focus();
                      }}
                      onClick={() => props.onChange(yAxisProp as EditablePropertyId, value)}
                      title={label}
                      type="button"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Grid Layout Properties */}
        {isGrid && (
          <div data-hawk-eye-ui="labelled-single">
            <span data-hawk-eye-ui="input-label">This Grid</span>
            <GridTrackEditor
              axis="columns"
              label="Columns"
              onChange={(value) => props.onChange('gridColumns', value)}
              propertyId="gridColumns"
              snapshot={props.selectedDraft.properties.gridColumns}
            />
            <GridTrackEditor
              axis="rows"
              label="Rows"
              onChange={(value) => props.onChange('gridRows', value)}
              propertyId="gridRows"
              snapshot={props.selectedDraft.properties.gridRows}
            />
            <div data-hawk-eye-ui="labelled-row">
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Row Gap</span>
                {card('rowGap', props)}
              </div>
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Column Gap</span>
                {card('columnGap', props)}
              </div>
            </div>
          </div>
        )}

        {/* Grid Child Properties — only when parent is grid */}
        {parentIsGrid && (
          <div data-hawk-eye-ui="labelled-single">
            <span data-hawk-eye-ui="input-label">In Parent Grid</span>
            <div data-hawk-eye-ui="labelled-row">
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Column Span</span>
                {card('columnSpan', props)}
              </div>
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Row Span</span>
                {card('rowSpan', props)}
              </div>
            </div>
          </div>
        )}

      </div>
    </CollapsibleSection>
  );
}

// ── Size & Spacing Section ───────────────────────────────────────────────

function SizeSpacingSection(props: SectionProps) {
  const parentDisplay = props.selectedDraft.context.parentDisplay;
  const parentIsGrid = parentDisplay === 'grid' || parentDisplay === 'inline-grid';

  return (
    <CollapsibleSection
      defaultExpanded
      key="sizeSpacing"
      sectionId="positionSize"
      title="Size & Spacing"
    >
      <div data-hawk-eye-ui="section-stack">
        {!parentIsGrid && (
          <div data-hawk-eye-ui="size-row-with-lock">
            <div data-hawk-eye-ui="size-input-flex">
              <SizeInput
                definition={editablePropertyDefinitionMap.width}
                label="W"
                mode={props.selectedDraft.sizeControl.widthMode.value}
                onChange={(value) => props.onChangeSizeValue('width', value)}
                onModeChange={(mode) => props.onChangeSizeMode('width', mode)}
                snapshot={props.selectedDraft.properties.width}
              />
            </div>
            <div data-hawk-eye-ui="size-input-flex">
              <SizeInput
                definition={editablePropertyDefinitionMap.height}
                label="H"
                mode={props.selectedDraft.sizeControl.heightMode.value}
                onChange={(value) => props.onChangeSizeValue('height', value)}
                onModeChange={(mode) => props.onChangeSizeMode('height', mode)}
                snapshot={props.selectedDraft.properties.height}
              />
            </div>
            <button
              aria-label={
                props.selectedDraft.sizeControl.aspectRatioLocked
                  ? 'Unlock aspect ratio'
                  : 'Lock aspect ratio'
              }
              aria-pressed={props.selectedDraft.sizeControl.aspectRatioLocked}
              data-hawk-eye-ui="aspect-ratio-lock-button"
              data-locked={props.selectedDraft.sizeControl.aspectRatioLocked ? 'true' : 'false'}
              onClick={props.onToggleAspectRatioLock}
              type="button"
              title="Toggle aspect ratio lock"
            >
              <AspectRatioLockIcon
                locked={props.selectedDraft.sizeControl.aspectRatioLocked}
              />
            </button>
          </div>
        )}

        {/* Padding PerSideCard */}
        <PerSideCard
          cardId="padding"
          label="Padding"
          onChange={props.onChange}
          onResetProperty={props.onResetProperty}
          propertyIds={{ top: 'paddingTop', right: 'paddingRight', bottom: 'paddingBottom', left: 'paddingLeft' }}
          selectedDraft={props.selectedDraft}
        />

        {/* Margin PerSideCard */}
        <PerSideCard
          cardId="margin"
          label="Margin"
          onChange={props.onChange}
          onResetProperty={props.onResetProperty}
          propertyIds={{ top: 'marginTop', right: 'marginRight', bottom: 'marginBottom', left: 'marginLeft' }}
          selectedDraft={props.selectedDraft}
        />
      </div>
    </CollapsibleSection>
  );
}

// ── Appearance Section ───────────────────────────────────────────────────

function AppearanceSection(props: SectionProps) {
  const showBackgroundFill = shouldShowAppearanceFill(props.selectedDraft.context);

  return (
    <CollapsibleSection
      defaultExpanded
      key="appearance"
      sectionId="fillOpacity"
      title="Appearance"
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Fill colour — full width */}
        {showBackgroundFill ? card('backgroundColor', props) : null}

        {/* Corner Radius — PerSideCard */}
        <PerSideCard
          cardId="cornerRadius"
          label="Corner Radius"
          onChange={props.onChange}
          onResetProperty={props.onResetProperty}
          propertyIds={{
            top: 'borderTopLeftRadius',
            right: 'borderTopRightRadius',
            bottom: 'borderBottomRightRadius',
            left: 'borderBottomLeftRadius',
          }}
          selectedDraft={props.selectedDraft}
        />

        {/* Opacity + Blending Mode row */}
        <div data-appearance-row="true" data-hawk-eye-ui="labelled-row">
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Opacity</span>
            {card('opacity', props)}
          </div>
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Blending Mode</span>
            {card('mixBlendMode', props)}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ── Typography Section ───────────────────────────────────────────────────

const TEXT_ALIGN_OPTIONS: Array<{ value: string; label: string; icon: JSX.Element }> = [
  {
    value: 'left',
    label: 'Left',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.3333 8.33333H2.5M16.6667 5H2.5M16.6667 11.6667H2.5M13.3333 15H2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'center',
    label: 'Center',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 8.33333H5M17.5 5H2.5M17.5 11.6667H2.5M15 15H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'right',
    label: 'Right',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.66667 8.33333H17.5M3.33333 5H17.5M3.33333 11.6667H17.5M6.66667 15H17.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'justify',
    label: 'Justify',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5 8.33333H2.5M17.5 15H2.5M17.5 5H2.5M17.5 11.6667H2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

function TypographySection(props: SectionProps) {
  const alignSnapshot = props.selectedDraft.properties.textAlign;
  const effectiveAlign = alignSnapshot.inputValue || alignSnapshot.baseline;

  return (
    <CollapsibleSection
      defaultExpanded
      key="typography"
      sectionId="typography"
      title={focusedGroupLabels.typography}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Font family — full width */}
        <div data-hawk-eye-ui="compact-row-full">
          {card('fontFamily', props)}
        </div>

        {/* Text fill — full width */}
        <div data-hawk-eye-ui="compact-row-full">
          {card('color', props)}
        </div>

        {/* Weight | Size — equal columns */}
        <div data-hawk-eye-ui="compact-row">
          {card('fontWeight', props)}
          {card('fontSize', props)}
        </div>

        {/* Line height | Letter spacing — labels above each */}
        <div data-hawk-eye-ui="labelled-row">
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Line height</span>
            {card('lineHeight', props)}
          </div>
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Letter Spacing</span>
            {card('letterSpacing', props)}
          </div>
        </div>

        {/* Alignment — label above icon buttons */}
        <div data-hawk-eye-ui="labelled-single">
          <span data-hawk-eye-ui="input-label">Alignment</span>
          <div data-hawk-eye-ui="icon-segmented">
            {TEXT_ALIGN_OPTIONS.map(({ value, label, icon }, index) => (
              <button
                aria-label={`Text alignment: ${label}`}
                aria-pressed={effectiveAlign === value}
                data-active={effectiveAlign === value ? 'true' : 'false'}
                data-hawk-eye-control={`textAlign-${value}`}
                data-hawk-eye-ui="icon-seg-btn"
                key={value}
                onKeyDown={(event) => {
                  if (!isGroupNavigationKey(event.key)) {
                    return;
                  }

                  event.preventDefault();

                  const nextIndex = getNextGroupIndex(
                    event.key,
                    index,
                    TEXT_ALIGN_OPTIONS.length
                  );
                  const nextOption = TEXT_ALIGN_OPTIONS[nextIndex];

                  if (!nextOption) {
                    return;
                  }

                  props.onChange('textAlign', nextOption.value);
                  const buttons =
                    event.currentTarget.parentElement?.querySelectorAll<globalThis.HTMLButtonElement>(
                      'button'
                    );
                  buttons?.[nextIndex]?.focus();
                }}
                onClick={() => props.onChange('textAlign', value)}
                title={label}
                type="button"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ── Border Section ───────────────────────────────────────────────────────

function DashGapCard({ selectedDraft, onChange, onResetProperty }: SectionProps) {
  const snapshot = selectedDraft.properties.strokeDasharray;
  const rawValue = snapshot.inputValue || snapshot.value || '';
  const parts = rawValue.trim().split(/\s+/);
  const dashNum = parts[0] ?? '4';
  const gapNum = parts[1] ?? '4';

  function handleDashChange(val: string) {
    const num = val.replace(/[^0-9.]/g, '') || '0';
    onChange('strokeDasharray', `${num} ${gapNum}`);
  }
  function handleGapChange(val: string) {
    const num = val.replace(/[^0-9.]/g, '') || '0';
    onChange('strokeDasharray', `${dashNum} ${num}`);
  }

  const dashDef = { id: 'strokeDasharray' as const, label: 'Dash', shortLabel: 'Dash', cssProperty: 'stroke-dasharray', group: 'stroke' as const, control: 'number' as const, placeholder: '', units: ['px'] };
  const gapDef  = { id: 'strokeDasharray' as const, label: 'Gap',  shortLabel: 'Gap',  cssProperty: 'stroke-dasharray', group: 'stroke' as const, control: 'number' as const, placeholder: '', units: ['px'] };
  const mkSnap = (val: string): PropertySnapshot => ({ ...snapshot, inputValue: val, value: val, baseline: val, invalid: false });

  const dirty = snapshot.value !== snapshot.baseline;

  void onResetProperty;

  return (
    <div data-hawk-eye-ui="labelled-row">
      <div data-hawk-eye-ui="labelled-col">
        <span data-hawk-eye-ui="input-label">Dash</span>
        <div data-dirty={dirty ? 'true' : 'false'} data-hawk-eye-ui="compact-card" data-property-id="strokeDash">
          <NumberInput definition={dashDef} onChange={handleDashChange} snapshot={mkSnap(dashNum)} />
        </div>
      </div>
      <div data-hawk-eye-ui="labelled-col">
        <span data-hawk-eye-ui="input-label">Gap</span>
        <div data-dirty={dirty ? 'true' : 'false'} data-hawk-eye-ui="compact-card" data-property-id="strokeGap">
          <NumberInput definition={gapDef} onChange={handleGapChange} snapshot={mkSnap(gapNum)} />
        </div>
      </div>
    </div>
  );
}

function BorderSection(props: SectionProps) {
  const borderStyleSnapshot = props.selectedDraft.properties.borderStyle;
  const borderStyleValue = getSnapshotDisplayValue(borderStyleSnapshot);
  const hasStroke = isVisibleBorderStyle(borderStyleValue);
  const isDashed = borderStyleValue === 'dashed';
  const supportsDashPattern = props.selectedDraft.tagName === 'svg';

  function seedBorderWidths() {
    if (hasAnyBorderWidth(props.selectedDraft)) {
      return;
    }

    for (const propertyId of BORDER_WIDTH_PROPERTY_IDS) {
      props.onChange(propertyId, '1px');
    }
  }

  function ensureVisibleBorder(options?: { skipStyleSeed?: boolean; styleValue?: string }) {
    const targetStyle = options?.styleValue ?? borderStyleValue;

    if (!options?.skipStyleSeed && !isVisibleBorderStyle(borderStyleValue)) {
      props.onChange('borderStyle', isVisibleBorderStyle(targetStyle) ? targetStyle : 'solid');
    }

    seedBorderWidths();
  }

  const borderProps: SectionProps = {
    ...props,
    onChange(propertyId, value) {
      props.onChange(propertyId, value);

      if (propertyId === 'borderStyle') {
        if (isVisibleBorderStyle(value)) {
          ensureVisibleBorder({
            skipStyleSeed: true,
            styleValue: value,
          });
        }
        return;
      }

      if (propertyId === 'borderColor') {
        if (!hasStroke || !hasAnyBorderWidth(props.selectedDraft)) {
          ensureVisibleBorder();
        }
        return;
      }

      if (isBorderWidthPropertyId(propertyId)) {
        if (getBorderWidth({ ...props.selectedDraft.properties[propertyId], inputValue: value }) > 0 && !hasStroke) {
          props.onChange('borderStyle', 'solid');
        }
      }
    },
  };

  return (
    <CollapsibleSection
      defaultExpanded
      key="border"
      sectionId="border"
      title="Border"
    >
      <div data-hawk-eye-ui="section-stack">
        {card('borderStyle', borderProps)}
        {card('borderColor', borderProps)}
        {hasStroke && (
          <>
            {isDashed && supportsDashPattern ? <DashGapCard {...borderProps} /> : null}
            <PerSideCard
              cardId="borderWidth"
              label="Stroke Weight"
              onChange={borderProps.onChange}
              onResetProperty={borderProps.onResetProperty}
              propertyIds={{ top: 'borderTopWidth', right: 'borderRightWidth', bottom: 'borderBottomWidth', left: 'borderLeftWidth' }}
              selectedDraft={borderProps.selectedDraft}
            />
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

export function PropertiesPanel({
  pendingDrafts: _pendingDrafts,
  selectedDraft,
  context,
  onChange,
  onChangeSizeMode,
  onChangeSizeValue,
  onResetAll: _onResetAll,
  onResetProperty,
  onToggleAspectRatioLock,
}: PropertiesPanelProps) {
  const sectionProps: SectionProps = {
    selectedDraft,
    onChange,
    onChangeSizeMode,
    onChangeSizeValue,
    onResetProperty,
    onToggleAspectRatioLock,
  };

  const showTypography =
    context.isTextElement ||
    context.hasDirectText ||
    context.hasNonDefaultTypography;

  return (
    <section data-hawk-eye-ui="property-stack">
      <LayoutSection key="layout" {...sectionProps} />
      <SizeSpacingSection key="sizeSpacing" {...sectionProps} />
      <AppearanceSection key="appearance" {...sectionProps} />
      {showTypography ? <TypographySection key="typography" {...sectionProps} /> : null}
      <BorderSection key="border" {...sectionProps} />
    </section>
  );
}
