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
        <rect x="3.5" y="3.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="6.5" y="6.5" width="7" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    value: 'column',
    label: 'Vertical Stack',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 5h12M4 10h8M4 15h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'stack',
    label: 'Horizontal Stack',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 4v12M10 4v8M15 4v10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'grid',
    label: 'Grid',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'none',
    label: 'Hidden',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="3.5" y="3.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
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
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 6.5L6 4m0 0L3.5 6.5M6 4v5a3 3 0 003 3h2m0 0l2.5-2.5M14 14l2.5-2.5M14 14v-5a3 3 0 00-3-3H9" />
              </svg>
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
  return (
    <CollapsibleSection
      defaultExpanded
      key="appearance"
      sectionId="fillOpacity"
      title="Appearance"
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Fill colour — full width */}
        {card('backgroundColor', props)}

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
        <path d="M3 5h14M3 10h9M3 15h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'center',
    label: 'Center',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h14M5 10h10M4 15h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'right',
    label: 'Right',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h14M8 10h9M5 15h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'justify',
    label: 'Justify',
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
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
  const borderStyleValue = borderStyleSnapshot.inputValue || borderStyleSnapshot.value || borderStyleSnapshot.baseline;
  const hasStroke = borderStyleValue !== 'none' && borderStyleValue !== '';
  const isDashed = borderStyleValue === 'dashed';

  // Intercept borderStyle changes to auto-set 1px width when switching to solid
  const borderProps: SectionProps = {
    ...props,
    onChange(propertyId, value) {
      props.onChange(propertyId, value);
      if (propertyId === 'borderStyle' && value === 'solid') {
        props.onChange('borderTopWidth', '1px');
        props.onChange('borderRightWidth', '1px');
        props.onChange('borderBottomWidth', '1px');
        props.onChange('borderLeftWidth', '1px');
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
        {/* Stroke Colour + Type row */}
        <div data-hawk-eye-ui="labelled-row">
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Stroke Colour</span>
            {card('borderColor', borderProps)}
          </div>
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Type</span>
            {card('borderStyle', borderProps)}
          </div>
        </div>
        {hasStroke && (
          <>
            {isDashed && <DashGapCard {...borderProps} />}
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
