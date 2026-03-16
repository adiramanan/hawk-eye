import type { JSX, ReactNode } from 'react';
import {
  BoxShadowInput,
  ColorInput,
  NumberInput,
  PerCornerControl,
  PerSideControl,
  SegmentedControl,
  SelectInput,
  SliderInput,
  TextInput,
} from './controls';
import {
  FOCUSED_PROPERTY_IDS,
  editablePropertyDefinitionMap,
  focusedGroupLabels,
  focusedGroupMembers,
  focusedGroupOrder,
} from './editable-properties';
import { getDirtyPropertyIds } from './drafts';
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
  EditablePropertyId,
  FocusedGroupId,
  SelectionDraft,
} from './types';

interface PropertiesPanelProps {
  pendingDrafts: SelectionDraft[];
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
}

function renderValue(value: string) {
  return value || 'none';
}

function getFocusedDirtyPropertyIds(draft: SelectionDraft) {
  return getDirtyPropertyIds(draft).filter((propertyId) => FOCUSED_PROPERTY_IDS.has(propertyId));
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

interface PerCornerCardProps {
  cardId: string;
  label: string;
  propertyIds: { topLeft: EditablePropertyId; topRight: EditablePropertyId; bottomRight: EditablePropertyId; bottomLeft: EditablePropertyId };
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
}

function PerCornerCard({
  cardId,
  label,
  propertyIds,
  selectedDraft,
  onChange,
  onResetProperty,
}: PerCornerCardProps) {
  const entries = [
    { id: propertyIds.topLeft, snapshot: selectedDraft.properties[propertyIds.topLeft] },
    { id: propertyIds.topRight, snapshot: selectedDraft.properties[propertyIds.topRight] },
    { id: propertyIds.bottomRight, snapshot: selectedDraft.properties[propertyIds.bottomRight] },
    { id: propertyIds.bottomLeft, snapshot: selectedDraft.properties[propertyIds.bottomLeft] },
  ];
  const dirtyEntries = entries.filter((e) => e.snapshot.value !== e.snapshot.baseline);

  return (
    <div
      data-dirty={dirtyEntries.length > 0 ? 'true' : 'false'}
      data-hawk-eye-ui="per-side-wrap"
      data-property-id={cardId}
    >
      <PerCornerControl
        key={`${selectedDraft.instanceKey}-${cardId}`}
        corners={{
          topLeft: { id: propertyIds.topLeft, snapshot: selectedDraft.properties[propertyIds.topLeft] },
          topRight: { id: propertyIds.topRight, snapshot: selectedDraft.properties[propertyIds.topRight] },
          bottomRight: { id: propertyIds.bottomRight, snapshot: selectedDraft.properties[propertyIds.bottomRight] },
          bottomLeft: { id: propertyIds.bottomLeft, snapshot: selectedDraft.properties[propertyIds.bottomLeft] },
        }}
        label={label}
        onChange={onChange}
        onReset={(propertyId) => onResetProperty(selectedDraft.instanceKey, propertyId)}
      />
    </div>
  );
}

// ── Section renderers ──────────────────────────────────────────────────────

interface SectionProps {
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
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

  return (
    <CollapsibleSection
      defaultExpanded
      key="positionSize"
      sectionId="positionSize"
      title={focusedGroupLabels.positionSize}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* W / H row */}
        <div data-hawk-eye-ui="compact-row">
          {card('width', props, 'W')}
          {card('height', props, 'H')}
        </div>
        {/* X / Y row — only when positioned */}
        {isPositioned && (
          <div data-hawk-eye-ui="compact-row">
            {card('left', props, 'X')}
            {card('top', props, 'Y')}
          </div>
        )}
        {/* Position type full width */}
        <div data-hawk-eye-ui="compact-row-full">
          {card('positionType', props)}
        </div>
      </div>
    </CollapsibleSection>
  );
}

function AutoLayoutSection(props: SectionProps) {
  const displayValue = props.selectedDraft.properties.display?.value ?? '';
  const isFlex = displayValue === 'flex' || displayValue === 'inline-flex';

  return (
    <CollapsibleSection
      defaultExpanded
      key="autoLayout"
      sectionId="autoLayout"
      title={focusedGroupLabels.autoLayout}
    >
      <div data-hawk-eye-ui="section-stack">
        <div data-hawk-eye-ui="compact-row-full">
          {card('display', props)}
        </div>
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
              {card('alignSelf', props)}
            </div>
            <div data-hawk-eye-ui="compact-row">
              {card('gap', props, 'Gap')}
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}

function SpacingSection(props: SectionProps) {
  return (
    <CollapsibleSection
      defaultExpanded
      key="spacing"
      sectionId="spacing"
      title={focusedGroupLabels.spacing}
    >
      <div data-hawk-eye-ui="section-stack">
        <PerSideCard
          cardId="padding"
          label="Padding"
          onChange={props.onChange}
          onResetProperty={props.onResetProperty}
          propertyIds={{ top: 'paddingTop', right: 'paddingRight', bottom: 'paddingBottom', left: 'paddingLeft' }}
          selectedDraft={props.selectedDraft}
        />
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

function FillOpacitySection(props: SectionProps) {
  return (
    <CollapsibleSection
      defaultExpanded
      key="fillOpacity"
      sectionId="fillOpacity"
      title={focusedGroupLabels.fillOpacity}
    >
      <div data-hawk-eye-ui="section-stack">
        <div data-hawk-eye-ui="compact-row-full">
          {card('backgroundColor', props)}
        </div>
        <div data-hawk-eye-ui="compact-row-full">
          {card('opacity', props)}
        </div>
      </div>
    </CollapsibleSection>
  );
}

function BorderSection(props: SectionProps) {
  return (
    <CollapsibleSection
      defaultExpanded
      key="border"
      sectionId="border"
      title={focusedGroupLabels.border}
    >
      <div data-hawk-eye-ui="section-stack">
        <div data-hawk-eye-ui="compact-row">
          {card('borderColor', props)}
          {card('borderStyle', props)}
        </div>
        <PerSideCard
          cardId="borderWidth"
          label="Width"
          onChange={props.onChange}
          onResetProperty={props.onResetProperty}
          propertyIds={{ top: 'borderTopWidth', right: 'borderRightWidth', bottom: 'borderBottomWidth', left: 'borderLeftWidth' }}
          selectedDraft={props.selectedDraft}
        />
        <PerCornerCard
          cardId="borderRadius"
          label="Radius"
          onChange={props.onChange}
          onResetProperty={props.onResetProperty}
          propertyIds={{ topLeft: 'borderTopLeftRadius', topRight: 'borderTopRightRadius', bottomRight: 'borderBottomRightRadius', bottomLeft: 'borderBottomLeftRadius' }}
          selectedDraft={props.selectedDraft}
        />
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
  const alignDirty = alignSnapshot.value !== alignSnapshot.baseline;
  const effectiveAlign = alignSnapshot.inputValue || alignSnapshot.baseline;

  return (
    <CollapsibleSection
      defaultExpanded
      key="typography"
      sectionId="typography"
      title={focusedGroupLabels.typography}
    >
      <div data-hawk-eye-ui="section-stack">
        {/* Row 1: Font family */}
        <div data-hawk-eye-ui="compact-row-full">
          {card('fontFamily', props)}
        </div>

        {/* Row 2: Weight (wider) | Size (narrower) — matches Figma order */}
        <div data-hawk-eye-ui="compact-row typo-weight-size">
          {card('fontWeight', props)}
          {card('fontSize', props)}
        </div>

        {/* Row 3: Sub-labels above LH / LS */}
        <div data-hawk-eye-ui="typo-label-row">
          <span>Line height</span>
          <span>Letter spacing</span>
        </div>

        {/* Row 4: LH | LS inputs */}
        <div data-hawk-eye-ui="compact-row">
          {card('lineHeight', props)}
          {card('letterSpacing', props)}
        </div>

        {/* Row 5: Text colour */}
        <div data-hawk-eye-ui="compact-row-full">
          {card('color', props)}
        </div>

        {/* Row 6: Alignment label + icon buttons */}
        <div data-hawk-eye-ui="typo-align-header">
          <span data-hawk-eye-ui="typo-section-label">Alignment</span>
          {alignDirty ? (
            <button
              data-hawk-eye-ui="control-reset-mini"
              onClick={() => props.onResetProperty(props.selectedDraft.instanceKey, 'textAlign')}
              type="button"
            >
              ↺
            </button>
          ) : null}
        </div>
        <div data-hawk-eye-ui="icon-segmented">
          {TEXT_ALIGN_OPTIONS.map(({ value, label, icon }) => (
            <button
              aria-label={label}
              aria-pressed={effectiveAlign === value}
              data-active={effectiveAlign === value ? 'true' : 'false'}
              data-hawk-eye-ui="icon-seg-btn"
              key={value}
              onClick={() => props.onChange('textAlign', value)}
              title={label}
              type="button"
            >
              {icon}
            </button>
          ))}
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
  pendingDrafts,
  selectedDraft,
  onChange,
  onResetAll,
  onResetProperty,
}: PropertiesPanelProps) {
  const dirtyDrafts = pendingDrafts
    .map((draft) => ({
      draft,
      dirtyProperties: getFocusedDirtyPropertyIds(draft),
    }))
    .filter((entry) => entry.draft.detached || entry.dirtyProperties.length > 0);

  const sectionProps: SectionProps = { selectedDraft, onChange, onResetProperty };

  const sectionRenderers: Record<FocusedGroupId, ReactNode> = {
    positionSize: <PositionSizeSection key="positionSize" {...sectionProps} />,
    autoLayout: <AutoLayoutSection key="autoLayout" {...sectionProps} />,
    spacing: <SpacingSection key="spacing" {...sectionProps} />,
    fillOpacity: <FillOpacitySection key="fillOpacity" {...sectionProps} />,
    border: <BorderSection key="border" {...sectionProps} />,
    typography: <TypographySection key="typography" {...sectionProps} />,
    effects: <EffectsSection key="effects" {...sectionProps} />,
  };

  // Suppress unused import warnings — keep these for potential future use
  void focusedGroupMembers;

  return (
    <>
      <section data-hawk-eye-ui="property-stack">
        {focusedGroupOrder.map((group) => sectionRenderers[group])}
      </section>

      <section data-hawk-eye-ui="changes-section">
        <div data-hawk-eye-ui="group-header">
          <h3 data-hawk-eye-ui="group-title">Pending changes</h3>
          {dirtyDrafts.length > 0 ? (
            <button data-hawk-eye-ui="secondary-button" onClick={onResetAll} type="button">
              Reset all
            </button>
          ) : null}
        </div>

        {dirtyDrafts.length > 0 ? (
          <div data-hawk-eye-ui="changes-list">
            {dirtyDrafts.map(({ draft, dirtyProperties }) => (
              <article data-hawk-eye-ui="change-card" key={draft.instanceKey}>
                <div data-hawk-eye-ui="change-card-head">
                  <div>
                    <p data-hawk-eye-ui="change-title">{draft.tagName}</p>
                    <p data-hawk-eye-ui="change-source">{draft.source}</p>
                  </div>
                  <span data-hawk-eye-ui="change-count">
                    {draft.detached
                      ? dirtyProperties.length > 0
                        ? `${dirtyProperties.length} edits + detached`
                        : 'detached'
                      : `${dirtyProperties.length} edits`}
                  </span>
                </div>

                <div data-hawk-eye-ui="change-items">
                  {draft.detached ? (
                    <div data-hawk-eye-ui="change-item">
                      <div data-hawk-eye-ui="change-copy">
                        <span data-hawk-eye-ui="change-label">Detach</span>
                        <span data-hawk-eye-ui="change-values">
                          Focused properties will be written inline when this draft is saved.
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {dirtyProperties.map((propertyId) => {
                    const definition = editablePropertyDefinitionMap[propertyId];
                    const snapshot = draft.properties[propertyId];

                    return (
                      <div data-hawk-eye-ui="change-item" key={`${draft.instanceKey}-${propertyId}`}>
                        <div data-hawk-eye-ui="change-copy">
                          <span data-hawk-eye-ui="change-label">{definition.shortLabel}</span>
                          <span data-hawk-eye-ui="change-values">
                            {renderValue(snapshot.baseline)} {'->'} {renderValue(snapshot.value)}
                          </span>
                        </div>
                        <button
                          data-hawk-eye-ui="pill-button"
                          onClick={() => onResetProperty(draft.instanceKey, propertyId)}
                          type="button"
                        >
                          Reset
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p data-hawk-eye-ui="hint">
            Live preview changes stay in this session only. Use the controls above to start editing.
          </p>
        )}
      </section>
    </>
  );
}
