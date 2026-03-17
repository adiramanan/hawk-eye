import React, { type JSX, type ReactNode } from 'react';
import {
  BoxShadowInput,
  ColorInput,
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
import type {
  EditablePropertyDefinition,
  EditablePropertyId,
  ElementContext,
  FocusedGroupId,
  PropertySnapshot,
  SelectionDraft,
  SizeAxis,
  SizeMode,
} from './types';

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

function PositionSizeSection(props: SectionProps) {
  const positionValue = props.selectedDraft.properties.positionType?.value ?? '';
  const isPositioned = positionValue === 'absolute' || positionValue === 'fixed' || positionValue === 'relative';
  const [radiusMode, setRadiusMode] = React.useState<'all' | 'each'>('all');

  return (
    <CollapsibleSection
      defaultExpanded
      key="positionSize"
      sectionId="positionSize"
      title={focusedGroupLabels.positionSize}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Size row: W and H side by side with aspect ratio lock button */}
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
            data-hawk-eye-ui="aspect-ratio-lock-button"
            data-locked={props.selectedDraft.sizeControl.aspectRatioLocked ? 'true' : 'false'}
            onClick={props.onToggleAspectRatioLock}
            type="button"
            title="Toggle aspect ratio lock"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.75 1h-5.5C3.34 1 2 2.34 2 3.75v12.5C2 17.66 3.34 19 4.75 19h10.5c1.41 0 2.75-1.34 2.75-2.75V9.25c0-.41-.34-.75-.75-.75s-.75.34-.75.75v4.5h-3v-8h3V5.5c0-.41.34-.75.75-.75s.75.34.75.75v-1.75C17 2.34 15.66 1 14.25 1zm-8.5 14v-5h5v5h-5z" />
            </svg>
          </button>
        </div>

        {/* Corner Radius section */}
        <div data-hawk-eye-ui="corner-radius-section">
          <div data-hawk-eye-ui="corner-radius-header">
            <span>Corner Radius</span>
          </div>
          <div data-hawk-eye-ui="corner-radius-controls">
            <select
              data-hawk-eye-ui="radius-mode-select"
              value={radiusMode}
              onChange={(e) => setRadiusMode(e.target.value as 'all' | 'each')}
            >
              <option value="all">All</option>
              <option value="each">Each</option>
            </select>
            {radiusMode === 'all' ? (
              <div data-hawk-eye-ui="compact-card">
                {card('borderRadius', props)}
              </div>
            ) : (
              <div data-hawk-eye-ui="compact-row">
                {card('borderTopLeftRadius', props)}
                {card('borderTopRightRadius', props)}
              </div>
            )}
            {radiusMode === 'each' && (
              <div data-hawk-eye-ui="compact-row">
                {card('borderBottomRightRadius', props)}
                {card('borderBottomLeftRadius', props)}
              </div>
            )}
          </div>
        </div>

        {/* Position type full width */}
        <div data-hawk-eye-ui="compact-row-full">
          {card('positionType', props)}
        </div>

        {/* X / Y row — only when positioned */}
        {isPositioned && (
          <div data-hawk-eye-ui="compact-row">
            {card('left', props, 'X')}
            {card('top', props, 'Y')}
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

function AutoLayoutSection(props: SectionProps) {
  const displayValue = props.selectedDraft.properties.display?.value ?? '';
  const isFlex = displayValue === 'flex' || displayValue === 'inline-flex';
  const isGrid = displayValue === 'grid';

  // Determine layout mode from display value
  let layoutMode = 'none';
  if (isFlex) layoutMode = 'stack';
  if (isGrid) layoutMode = 'grid';

  const handleLayoutModeChange = (value: string) => {
    if (value === 'stack') {
      props.onChange('display', 'flex');
    } else if (value === 'grid') {
      props.onChange('display', 'grid');
    } else {
      props.onChange('display', 'block');
    }
  };

  return (
    <CollapsibleSection
      defaultExpanded
      key="autoLayout"
      sectionId="autoLayout"
      title={focusedGroupLabels.autoLayout}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Layout Mode Selector */}
        <div data-hawk-eye-ui="compact-row-full">
          <SegmentedControl
            definition={{
              id: 'display',
              label: 'Layout Mode',
              control: 'segmented',
              placeholder: 'none',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Stack', value: 'stack' },
                { label: 'Grid', value: 'grid' },
              ],
              group: 'autoLayout',
            } as EditablePropertyDefinition}
            onChange={(v) => handleLayoutModeChange(v)}
            snapshot={{
              baseline: '',
              inlineValue: '',
              inputValue: layoutMode,
              invalid: false,
              value: layoutMode,
            }}
          />
        </div>

        {/* Stack Layout Properties */}
        {isFlex && (
          <>
            <div data-hawk-eye-ui="compact-row-full">
              {card('flexDirection', props)}
            </div>
            <div data-hawk-eye-ui="compact-row">
              {card('justifyContent', props)}
              {card('alignItems', props)}
            </div>
            <div data-hawk-eye-ui="compact-row">
              {card('flexWrap', props)}
              {card('gap', props, 'Gap')}
            </div>
            <div data-hawk-eye-ui="compact-row">
              {card('flexGrow', props)}
              {card('flexShrink', props)}
              {card('flexBasis', props, 'Basis')}
            </div>
          </>
        )}

        {/* Grid Layout Properties */}
        {isGrid && (
          <>
            <div data-hawk-eye-ui="compact-row">
              {card('gridColumns', props)}
              {card('gridRows', props)}
            </div>
            <div data-hawk-eye-ui="compact-row">
              {card('columnGap', props)}
              {card('rowGap', props)}
            </div>
            <div data-hawk-eye-ui="compact-row-full">
              {card('gridAutoFlow', props)}
            </div>
            <div data-hawk-eye-ui="compact-row">
              {card('columnSpan', props)}
              {card('rowSpan', props)}
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}

function FillOpacitySection(props: SectionProps) {
  return (
    <CollapsibleSection
      defaultExpanded
      key="fillOpacity"
      sectionId="fillOpacity"
      title="Appearance"
    >
      <div data-hawk-eye-ui="section-stack">
        <div data-hawk-eye-ui="labelled-single">
          <span data-hawk-eye-ui="input-label">Fill Colour</span>
          {card('backgroundColor', props)}
        </div>
        <div data-hawk-eye-ui="labelled-row">
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Opacity</span>
            {card('opacity', props)}
          </div>
          <div data-hawk-eye-ui="labelled-col">
            <span data-hawk-eye-ui="input-label">Corner Radius</span>
            {card('borderRadius', props)}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

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
        <div data-hawk-eye-ui="labelled-single">
          <span data-hawk-eye-ui="input-label">Type</span>
          {card('borderStyle', borderProps)}
        </div>
        {hasStroke && (
          <>
            <div data-hawk-eye-ui="labelled-single">
              <span data-hawk-eye-ui="input-label">Stroke Colour</span>
              {card('borderColor', borderProps)}
            </div>
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

const TEXT_ALIGN_OPTIONS: Array<{ value: string; label: string; icon: JSX.Element }> = [
  {
    value: 'left',
    label: 'Left',
    icon: (
      <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3h12M1 7h8M1 11h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'center',
    label: 'Center',
    icon: (
      <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3h12M3 7h8M2 11h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'right',
    label: 'Right',
    icon: (
      <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3h12M5 7h8M3 11h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    value: 'justify',
    label: 'Justify',
    icon: (
      <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
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

        {/* Text Colour — full width */}
        <div data-hawk-eye-ui="labelled-single">
          <span data-hawk-eye-ui="input-label">Text Colour</span>
          {card('color', props)}
        </div>

        {/* Weight | Size — equal columns, no sub-labels */}
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
            <span data-hawk-eye-ui="input-label">Letter spacing</span>
            {card('letterSpacing', props)}
          </div>
        </div>

        {/* Alignment — label above icon buttons */}
        <div data-hawk-eye-ui="labelled-single">
          <span data-hawk-eye-ui="input-label">Alignment</span>
          <div data-hawk-eye-ui="icon-segmented">
            {TEXT_ALIGN_OPTIONS.map(({ value, label, icon }, index) => (
              <button
                aria-label={label}
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

function EffectsSection(props: SectionProps) {
  const { selectedDraft, onChange, onResetProperty } = props;
  const shadowSnapshot = selectedDraft.properties.boxShadow;
  const shadowDirty = shadowSnapshot.value !== shadowSnapshot.baseline;

  return (
    <CollapsibleSection
      defaultExpanded
      key="effects"
      sectionId="effects"
      title={focusedGroupLabels.effects}
    >
      <div data-hawk-eye-ui="section-stack">
        <div
          data-dirty={shadowDirty ? 'true' : 'false'}
          data-hawk-eye-ui="compact-card"
          data-invalid={shadowSnapshot.invalid ? 'true' : 'false'}
          data-property-id="boxShadow"
        >
          <BoxShadowInput
            onChange={(value) => onChange('boxShadow', value)}
            snapshot={shadowSnapshot}
          />
          {shadowDirty && (
            <button
              data-hawk-eye-ui="control-reset-mini"
              onClick={() => onResetProperty(selectedDraft.instanceKey, 'boxShadow')}
              type="button"
            >
              ↺
            </button>
          )}
        </div>
        <div data-hawk-eye-ui="compact-row-full">
          {card('filter', props)}
        </div>
        <div data-hawk-eye-ui="compact-row-full">
          {card('backdropFilter', props)}
        </div>
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

  const sectionRenderers: Record<FocusedGroupId, ReactNode> = {
    positionSize: <PositionSizeSection key="positionSize" {...sectionProps} />,
    autoLayout: <AutoLayoutSection key="autoLayout" {...sectionProps} />,
    spacing: null,
    fillOpacity: <FillOpacitySection key="fillOpacity" {...sectionProps} />,
    border: <BorderSection key="border" {...sectionProps} />,
    typography: showTypography ? <TypographySection key="typography" {...sectionProps} /> : null,
    effects: <EffectsSection key="effects" {...sectionProps} />,
  };
  return (
    <section data-hawk-eye-ui="property-stack">
      {(['positionSize', 'autoLayout', 'fillOpacity', 'typography', 'border', 'effects'] as const).map(
        (group) => sectionRenderers[group]
      )}
    </section>
  );
}
