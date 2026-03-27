import { type JSX, type ReactNode } from 'react';
import alignCenterIconInactive from './icons/Icon=Align Center Icon, Style=inactive.svg';
import alignCenterIconNormal from './icons/Icon=Align Center Icon, Style=normal.svg';
import alignJustifyIconInactive from './icons/Icon=Align Justify Icon, Style=inactive.svg';
import alignJustifyIconNormal from './icons/Icon=Align Justify Icon, Style=normal.svg';
import alignLeftIconInactive from './icons/Icon=Align Left Icon, Style=inactive.svg';
import alignLeftIconNormal from './icons/Icon=Align Left Icon, Style=normal.svg';
import alignRightIconInactive from './icons/Icon=Align Right Icon, Style=inactive.svg';
import alignRightIconNormal from './icons/Icon=Align Right Icon, Style=normal.svg';
import alignLeft02Active from './icons/Icon=align-left-02, Style=active.svg';
import alignLeft02Normal from './icons/Icon=align-left-02, Style=normal.svg';
import alignTop02Active from './icons/Icon=align-top-02, Style=active.svg';
import alignTop02Normal from './icons/Icon=align-top-02, Style=normal.svg';
import grid01Active from './icons/Icon=grid-01, Style=active.svg';
import grid01Normal from './icons/Icon=grid-01, Style=normal.svg';
import xSquareActive from './icons/Icon=x-square, Style=active.svg';
import xSquareNormal from './icons/Icon=x-square, Style=normal.svg';
import {
  ColorInput,
  FillInput,
  GridTrackEditor,
  NumberInput,
  PerSideControl,
  SegmentedControl,
  SelectInput,
  SliderInput,
  TextInput,
  ToggleSwitch,
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
import { V1_PROPERTIES } from './types';

// ── V1 Scoping ──────────────────────────────────────────────────────────────

/**
 * Check if a property should be rendered in the UI.
 * In v1, only properties in V1_PROPERTIES are shown.
 */
function shouldShowProperty(propertyId: EditablePropertyId): boolean {
  return V1_PROPERTIES.includes(propertyId);
}

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
  onChangeClassTarget(targetId: string): void;
  onChangeSizeMode(axis: SizeAxis, mode: SizeMode): void;
  onChangeSizeValue(axis: SizeAxis, value: string): void;
  onDetach(): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
  onToggleAspectRatioLock(): void;
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
  const normalizedToggleSnapshot =
    propertyId === 'display'
      ? {
          ...snapshot,
          baseline: snapshot.baseline === 'none' ? 'none' : 'block',
          inputValue: (snapshot.inputValue || snapshot.value) === 'none' ? 'none' : 'block',
          value: snapshot.value === 'none' ? 'none' : 'block',
        }
      : snapshot;

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
  } else if (definition.control === 'color' || propertyId === 'backgroundColor') {
    control = (
      <ColorInput
        definition={
          propertyId === 'backgroundColor'
            ? { ...definition, control: 'color' }
            : definition
        }
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
  } else if (definition.control === 'toggle') {
    control = (
      <ToggleSwitch
        definition={definition}
        onChange={(v) => onChange(propertyId, v)}
        snapshot={normalizedToggleSnapshot}
      />
    );
  } else if (definition.control === 'fill') {
    control = (
      <FillInput
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
        grouping={cardId === 'padding' ? 'opposite-each' : 'all-each'}
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

function hasVisibleAppearanceBackground(selectedDraft: SelectionDraft) {
  const backgroundValue = normalizeSnapshotCssValue(selectedDraft.properties.backgroundColor);
  const backgroundImageValue = normalizeSnapshotCssValue(selectedDraft.properties.backgroundImage);

  if (backgroundImageValue && backgroundImageValue !== 'none') {
    return true;
  }

  const isTransparentBackgroundShorthand =
    backgroundValue.startsWith('rgba(0, 0, 0, 0)') ||
    backgroundValue.startsWith('transparent');

  return Boolean(
    backgroundValue &&
      backgroundValue !== 'none' &&
      backgroundValue !== 'transparent' &&
      backgroundValue !== 'rgba(0, 0, 0, 0)' &&
      !isTransparentBackgroundShorthand
  );
}

function shouldShowAppearanceFill(selectedDraft: SelectionDraft) {
  if (!TEXT_ONLY_APPEARANCE_TAGS.has(selectedDraft.context.tagName)) {
    return true;
  }

  return hasVisibleAppearanceBackground(selectedDraft);
}

function shouldShowCornerRadius(context: ElementContext) {
  return !TEXT_ONLY_APPEARANCE_TAGS.has(context.tagName);
}

function normalizeSnapshotCssValue(snapshot: PropertySnapshot | undefined) {
  return getSnapshotDisplayValue(
    snapshot ?? { baseline: '', inlineValue: '', inputValue: '', invalid: false, value: '' }
  )
    .trim()
    .toLowerCase();
}

function hasExplicitNonSolidAppearanceFill(selectedDraft: SelectionDraft) {
  const backgroundValue = normalizeSnapshotCssValue(selectedDraft.properties.backgroundColor);
  const backgroundImageValue = normalizeSnapshotCssValue(selectedDraft.properties.backgroundImage);

  if (backgroundValue.includes('gradient(') || backgroundImageValue.includes('gradient(')) {
    return true;
  }

  if (backgroundValue.includes('url(') || backgroundImageValue.includes('url(')) {
    return true;
  }

  if (backgroundImageValue && backgroundImageValue !== 'none') {
    return true;
  }

  return false;
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

function ClassTargetBar({
  selectedDraft,
  onChangeClassTarget,
  onDetach,
}: {
  selectedDraft: SelectionDraft;
  onChangeClassTarget(targetId: string): void;
  onDetach(): void;
}) {
  const classTargets = selectedDraft.classTargets;

  if (classTargets.length === 0) {
    return null;
  }

  const activeTarget =
    classTargets.find((target) => target.id === selectedDraft.activeClassTargetId) ??
    classTargets[0];

  if (!activeTarget) {
    return null;
  }

  return (
    <div data-hawk-eye-ui="class-target-bar">
      <span data-hawk-eye-ui="class-target-label">
        {selectedDraft.detached ? 'Detached from' : 'Editing'}
      </span>
      {selectedDraft.detached ? (
        <span data-hawk-eye-ui="class-target-value">{activeTarget.label}</span>
      ) : (
        <>
          <select
            aria-label="Class target"
            data-hawk-eye-ui="select-input"
            onChange={(event) => onChangeClassTarget(event.currentTarget.value)}
            value={activeTarget.id}
          >
            {classTargets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
          <button
            data-hawk-eye-ui="pill-button"
            onClick={onDetach}
            type="button"
          >
            Detach
          </button>
        </>
      )}
    </div>
  );
}

interface SegmentedIconOption {
  value: string;
  label: string;
  selectedIconSrc: string;
  normalIconSrc: string;
}

function SegmentedIcon({
  active,
  selectedIconSrc,
  normalIconSrc,
}: {
  active: boolean;
  selectedIconSrc: string;
  normalIconSrc: string;
}) {
  return (
    <img
      alt=""
      aria-hidden="true"
      data-hawk-eye-ui="segmented-icon"
      draggable={false}
      height={20}
      src={active ? selectedIconSrc : normalIconSrc}
      width={20}
    />
  );
}

// ── Layout mode icon options ─────────────────────────────────────────────

const LAYOUT_MODE_OPTIONS: SegmentedIconOption[] = [
  {
    value: 'block',
    label: 'Block',
    selectedIconSrc: grid01Active,
    normalIconSrc: grid01Normal,
  },
  {
    value: 'column',
    label: 'Vertical Stack',
    selectedIconSrc: alignTop02Active,
    normalIconSrc: alignTop02Normal,
  },
  {
    value: 'stack',
    label: 'Horizontal Stack',
    selectedIconSrc: alignLeft02Active,
    normalIconSrc: alignLeft02Normal,
  },
  {
    value: 'grid',
    label: 'Grid',
    selectedIconSrc: grid01Active,
    normalIconSrc: grid01Normal,
  },
  {
    value: 'none',
    label: 'Hidden',
    selectedIconSrc: xSquareActive,
    normalIconSrc: xSquareNormal,
  },
];

// ── Alignment icon options ──────────────────────────────────────────────

const X_AXIS_OPTIONS: SegmentedIconOption[] = [
  {
    value: 'flex-start',
    label: 'Align Left',
    selectedIconSrc: alignLeft02Active,
    normalIconSrc: alignLeft02Normal,
  },
  {
    value: 'center',
    label: 'Align Center',
    selectedIconSrc: alignCenterIconInactive,
    normalIconSrc: alignCenterIconNormal,
  },
  {
    value: 'flex-end',
    label: 'Align Right',
    selectedIconSrc: alignRightIconInactive,
    normalIconSrc: alignRightIconNormal,
  },
];

const Y_AXIS_OPTIONS: SegmentedIconOption[] = [
  {
    value: 'flex-start',
    label: 'Align Top',
    selectedIconSrc: alignTop02Active,
    normalIconSrc: alignTop02Normal,
  },
  {
    value: 'center',
    label: 'Align Middle',
    selectedIconSrc: alignCenterIconInactive,
    normalIconSrc: alignCenterIconNormal,
  },
  {
    value: 'flex-end',
    label: 'Align Bottom',
    selectedIconSrc: alignTop02Active,
    normalIconSrc: alignTop02Normal,
  },
];

// ── Layout Section ───────────────────────────────────────────────────────

function LayoutSection(props: SectionProps) {
  // All layout properties (display, flexDirection, etc.) are deferred to v2+
  return null;

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
          {LAYOUT_MODE_OPTIONS.map(({ value, label, selectedIconSrc, normalIconSrc }, index) => (
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
              <SegmentedIcon
                active={layoutMode === value}
                selectedIconSrc={selectedIconSrc}
                normalIconSrc={normalIconSrc}
              />
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
                  {X_AXIS_OPTIONS.map(({ value, label, selectedIconSrc, normalIconSrc }, index) => (
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
                      <SegmentedIcon
                        active={xAxisValue === value}
                        selectedIconSrc={selectedIconSrc}
                        normalIconSrc={normalIconSrc}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Y-Axis</span>
                <div data-hawk-eye-ui="icon-segmented">
                  {Y_AXIS_OPTIONS.map(({ value, label, selectedIconSrc, normalIconSrc }, index) => (
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
                      <SegmentedIcon
                        active={yAxisValue === value}
                        selectedIconSrc={selectedIconSrc}
                        normalIconSrc={normalIconSrc}
                      />
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
                  {X_AXIS_OPTIONS.map(({ value, label, selectedIconSrc, normalIconSrc }, index) => (
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
                      <SegmentedIcon
                        active={xAxisValue === value}
                        selectedIconSrc={selectedIconSrc}
                        normalIconSrc={normalIconSrc}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Y-Axis</span>
                <div data-hawk-eye-ui="icon-segmented">
                  {Y_AXIS_OPTIONS.map(({ value, label, selectedIconSrc, normalIconSrc }, index) => (
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
                      <SegmentedIcon
                        active={yAxisValue === value}
                        selectedIconSrc={selectedIconSrc}
                        normalIconSrc={normalIconSrc}
                      />
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

      </div>
    </CollapsibleSection>
  );
}

// ── Spacing Section ──────────────────────────────────────────────────────

function SizeSpacingSection(props: SectionProps) {
  return (
    <CollapsibleSection
      defaultExpanded
      key="sizeSpacing"
      sectionId="positionSize"
      title="Spacing"
    >
      <div data-hawk-eye-ui="section-stack">
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
  const shouldHideFillColor = hasExplicitNonSolidAppearanceFill(props.selectedDraft);

  return (
    <CollapsibleSection
      defaultExpanded
      key="appearance"
      sectionId="fillOpacity"
      title="Appearance"
    >
      <div data-hawk-eye-ui="section-stack">
        {shouldShowAppearanceFill(props.selectedDraft) &&
          shouldShowProperty('backgroundColor') &&
          !shouldHideFillColor && (
            <div data-hawk-eye-ui="compact-row-full">
              {card('backgroundColor', props)}
            </div>
          )}

        {shouldShowCornerRadius(props.selectedDraft.context) && (
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
        )}

        {/* Opacity + Blending Mode row */}
        <div data-appearance-row="true" data-hawk-eye-ui="labelled-row">
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Opacity</span>
            {shouldShowProperty('opacity') ? card('opacity', props) : null}
          </div>
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Blending Mode</span>
            {shouldShowProperty('mixBlendMode') ? card('mixBlendMode', props) : null}
          </div>
        </div>

      </div>
    </CollapsibleSection>
  );
}

// ── Typography Section ───────────────────────────────────────────────────

const TEXT_ALIGN_OPTIONS: SegmentedIconOption[] = [
  {
    value: 'left',
    label: 'Left',
    selectedIconSrc: alignLeftIconNormal,
    normalIconSrc: alignLeftIconInactive,
  },
  {
    value: 'center',
    label: 'Center',
    selectedIconSrc: alignCenterIconNormal,
    normalIconSrc: alignCenterIconInactive,
  },
  {
    value: 'right',
    label: 'Right',
    selectedIconSrc: alignRightIconNormal,
    normalIconSrc: alignRightIconInactive,
  },
  {
    value: 'justify',
    label: 'Justify',
    selectedIconSrc: alignJustifyIconNormal,
    normalIconSrc: alignJustifyIconInactive,
  },
];

function normalizeTextAlign(value: string): string {
  if (value === 'start') return 'left';
  if (value === 'end') return 'right';
  return value;
}

function TypographySection(props: SectionProps) {
  const alignSnapshot = props.selectedDraft.properties.textAlign;
  const effectiveAlign = normalizeTextAlign(alignSnapshot.inputValue || alignSnapshot.baseline);

  const typographyProps: SectionProps = {
    ...props,
    onChange(propertyId, value) {
      props.onChange(propertyId, value);
      if (propertyId === 'lineClamp' && value && value !== 'none' && value !== '0') {
        props.onChange('overflow', 'hidden');
      }
    },
  };

  return (
    <CollapsibleSection
      defaultExpanded
      key="typography"
      sectionId="typography"
      title={focusedGroupLabels.typography}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Font family — full width */}
        {shouldShowProperty('fontFamily') && (
          <div data-hawk-eye-ui="compact-row-full">
            {card('fontFamily', props)}
          </div>
        )}

        {/* Text fill — full width */}
        {shouldShowProperty('color') && (
          <div data-hawk-eye-ui="compact-row-full">
            {card('color', props)}
          </div>
        )}

        {/* Weight | Size — equal columns */}
        <div data-hawk-eye-ui="compact-row">
          {shouldShowProperty('fontWeight') && card('fontWeight', props)}
          {shouldShowProperty('fontSize') && card('fontSize', props)}
        </div>

        {/* Line height | Letter spacing — labels above each */}
        <div data-hawk-eye-ui="labelled-row">
          {shouldShowProperty('lineHeight') && (
            <div data-hawk-eye-ui="labelled-col">
              <span data-hawk-eye-ui="input-label">Line height</span>
              {card('lineHeight', props)}
            </div>
          )}
          {shouldShowProperty('letterSpacing') && (
            <div data-hawk-eye-ui="labelled-col">
              <span data-hawk-eye-ui="input-label">Letter Spacing</span>
              {card('letterSpacing', props)}
            </div>
          )}
        </div>

        {/* Alignment — label above icon buttons */}
        {shouldShowProperty('textAlign') && (
          <div data-hawk-eye-ui="labelled-single">
            <span data-hawk-eye-ui="input-label">Alignment</span>
            <div data-hawk-eye-ui="icon-segmented">
              {TEXT_ALIGN_OPTIONS.map(({ value, label, selectedIconSrc, normalIconSrc }, index) => (
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
                  <SegmentedIcon
                    active={effectiveAlign === value}
                    selectedIconSrc={selectedIconSrc}
                    normalIconSrc={normalIconSrc}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text decoration | Case — labelled row */}
        {(shouldShowProperty('textDecoration') || shouldShowProperty('textTransform')) && (
          <div data-hawk-eye-ui="labelled-row">
            {shouldShowProperty('textDecoration') && (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Decoration</span>
                {card('textDecoration', props)}
              </div>
            )}
            {shouldShowProperty('textTransform') && (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Case</span>
                {card('textTransform', props)}
              </div>
            )}
          </div>
        )}

        {/* Text overflow row — deferred properties */}
        {(shouldShowProperty('whiteSpace') || shouldShowProperty('textOverflow')) && (
          <div data-hawk-eye-ui="labelled-row">
            {shouldShowProperty('whiteSpace') && (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">White space</span>
                {card('whiteSpace', typographyProps)}
              </div>
            )}
            {shouldShowProperty('textOverflow') && (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Text overflow</span>
                {card('textOverflow', typographyProps)}
              </div>
            )}
          </div>
        )}

        {/* Word break / overflow wrap row — deferred properties */}
        {(shouldShowProperty('wordBreak') || shouldShowProperty('overflowWrap')) && (
          <div data-hawk-eye-ui="labelled-row">
            {shouldShowProperty('wordBreak') && (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Word break</span>
                {card('wordBreak', typographyProps)}
              </div>
            )}
            {shouldShowProperty('overflowWrap') && (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Overflow wrap</span>
                {card('overflowWrap', typographyProps)}
              </div>
            )}
          </div>
        )}

        {/* Line clamp — deferred property */}
        {shouldShowProperty('lineClamp') && (
          <div data-hawk-eye-ui="labelled-single">
            <span data-hawk-eye-ui="input-label">Line clamp</span>
            {card('lineClamp', typographyProps)}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

function BorderSection(props: SectionProps) {
  const borderStyleSnapshot = props.selectedDraft.properties.borderStyle;
  const borderStyleValue = getSnapshotDisplayValue(borderStyleSnapshot);
  const hasStroke = isVisibleBorderStyle(borderStyleValue);

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
        {shouldShowProperty('borderStyle') && card('borderStyle', borderProps)}
        {hasStroke && (
          <>
            {shouldShowProperty('borderColor') ? card('borderColor', borderProps) : null}
            {shouldShowProperty('borderTopWidth') && (
              <PerSideCard
                cardId="borderWidth"
                label="Stroke Weight"
                onChange={borderProps.onChange}
                onResetProperty={borderProps.onResetProperty}
                propertyIds={{ top: 'borderTopWidth', right: 'borderRightWidth', bottom: 'borderBottomWidth', left: 'borderLeftWidth' }}
                selectedDraft={borderProps.selectedDraft}
              />
            )}
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
  onChangeClassTarget,
  onChangeSizeMode,
  onChangeSizeValue,
  onResetAll: _onResetAll,
  onResetProperty,
  onDetach,
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
      <ClassTargetBar
        onChangeClassTarget={onChangeClassTarget}
        onDetach={onDetach}
        selectedDraft={selectedDraft}
      />
      <LayoutSection key="layout" {...sectionProps} />
      <SizeSpacingSection key="sizeSpacing" {...sectionProps} />
      <AppearanceSection key="appearance" {...sectionProps} />
      {showTypography ? <TypographySection key="typography" {...sectionProps} /> : null}
      <BorderSection key="border" {...sectionProps} />
      {/* <TransitionSection key="transition" {...sectionProps} /> */}
    </section>
  );
}
