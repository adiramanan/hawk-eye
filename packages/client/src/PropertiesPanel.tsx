import type { ReactNode } from 'react';
import {
  BoxShadowInput,
  ColorInput,
  NumberInput,
  PerSideControl,
  SegmentedControl,
  SelectInput,
  SliderInput,
  TextInput,
  ToggleSwitch,
} from './controls';
import {
  FOCUSED_PROPERTY_IDS,
  editablePropertyDefinitionMap,
  focusedGroupLabels,
  focusedGroupMembers,
  focusedGroupOrder,
} from './editable-properties';
import { getDirtyPropertyIds } from './drafts';
import { CollapsibleSection, PropertyCard } from './sections';
import type {
  EditablePropertyDefinition,
  EditablePropertyId,
  FocusedGroupId,
  PropertySnapshot,
  SelectionDraft,
} from './types';

interface PropertiesPanelProps {
  pendingDrafts: SelectionDraft[];
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetAll(): void;
  onResetProperty(instanceKey: string, propertyId: EditablePropertyId): void;
}

interface PropertyCardOptions {
  compact?: boolean;
  span?: 'default' | 'full';
}

interface PerSidePropertyIds {
  top: EditablePropertyId;
  right: EditablePropertyId;
  bottom: EditablePropertyId;
  left: EditablePropertyId;
}

interface SectionContent {
  node: ReactNode;
}

function renderValue(value: string) {
  return value || 'none';
}

function getSnapshotMeta(snapshot: PropertySnapshot) {
  if (snapshot.invalid) {
    return `Invalid value. Preview stays at ${renderValue(snapshot.value)}.`;
  }

  if (snapshot.value !== snapshot.baseline) {
    return `${renderValue(snapshot.baseline)} -> ${renderValue(snapshot.value)}`;
  }

  return `Baseline ${renderValue(snapshot.baseline)}`;
}

function renderControl(
  definition: EditablePropertyDefinition,
  snapshot: PropertySnapshot,
  onChange: (value: string) => void
) {
  switch (definition.control) {
    case 'slider':
      return <SliderInput definition={definition} onChange={onChange} snapshot={snapshot} />;
    case 'color':
      return <ColorInput definition={definition} onChange={onChange} snapshot={snapshot} />;
    case 'select':
      return <SelectInput definition={definition} onChange={onChange} snapshot={snapshot} />;
    case 'segmented':
      return <SegmentedControl definition={definition} onChange={onChange} snapshot={snapshot} />;
    case 'toggle':
      return <ToggleSwitch definition={definition} onChange={onChange} snapshot={snapshot} />;
    case 'number':
      return <NumberInput definition={definition} onChange={onChange} snapshot={snapshot} />;
    case 'text':
    case 'per-side':
    default:
      return <TextInput definition={definition} onChange={onChange} snapshot={snapshot} />;
  }
}

function getPerSideMeta(entries: Array<{ label: string; snapshot: PropertySnapshot }>) {
  const invalidEntries = entries.filter((entry) => entry.snapshot.invalid);

  if (invalidEntries.length > 0) {
    return invalidEntries
      .map((entry) => `${entry.label}: preview stays at ${renderValue(entry.snapshot.value)}`)
      .join(' | ');
  }

  const dirtyEntries = entries.filter((entry) => entry.snapshot.value !== entry.snapshot.baseline);

  if (dirtyEntries.length > 0) {
    return dirtyEntries
      .map(
        (entry) =>
          `${entry.label}: ${renderValue(entry.snapshot.baseline)} -> ${renderValue(entry.snapshot.value)}`
      )
      .join(' | ');
  }

  return entries
    .map((entry) => `${entry.label}: ${renderValue(entry.snapshot.baseline)}`)
    .join(' | ');
}

function getFocusedDirtyPropertyIds(draft: SelectionDraft) {
  return getDirtyPropertyIds(draft).filter((propertyId) => FOCUSED_PROPERTY_IDS.has(propertyId));
}

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
    .filter((entry) => entry.dirtyProperties.length > 0);

  function renderSection(
    sectionId: FocusedGroupId,
    title: string,
    subtitle: string,
    count: number,
    layout: ReactNode
  ): SectionContent {
    return {
      node: (
        <CollapsibleSection
          action={<span data-hawk-eye-ui="section-count">{count}</span>}
          defaultExpanded
          key={sectionId}
          sectionId={sectionId}
          subtitle={subtitle}
          title={title}
        >
          {layout}
        </CollapsibleSection>
      ),
    };
  }

  function renderPropertyCard(
    propertyId: EditablePropertyId,
    options: PropertyCardOptions = {},
    onValueChange?: (propertyId: EditablePropertyId, value: string) => void
  ) {
    const definition = editablePropertyDefinitionMap[propertyId];
    const snapshot = selectedDraft.properties[propertyId];
    const dirty = snapshot.value !== snapshot.baseline;

    return (
      <PropertyCard
        action={
          dirty ? (
            <button
              data-hawk-eye-ui="control-reset"
              onClick={() => onResetProperty(selectedDraft.instanceKey, propertyId)}
              type="button"
            >
              Reset
            </button>
          ) : null
        }
        compact={options.compact}
        dirty={dirty}
        invalid={snapshot.invalid}
        key={propertyId}
        label={definition.label}
        meta={getSnapshotMeta(snapshot)}
        propertyId={propertyId}
        span={options.span}
      >
        {renderControl(definition, snapshot, (value) =>
          (onValueChange ?? onChange)(propertyId, value)
        )}
      </PropertyCard>
    );
  }

  function renderPerSideCard(
    cardId: string,
    label: string,
    propertyIds: PerSidePropertyIds
  ) {
    const entries = [
      {
        id: propertyIds.top,
        key: 'top',
        label: 'T',
        snapshot: selectedDraft.properties[propertyIds.top],
      },
      {
        id: propertyIds.right,
        key: 'right',
        label: 'R',
        snapshot: selectedDraft.properties[propertyIds.right],
      },
      {
        id: propertyIds.bottom,
        key: 'bottom',
        label: 'B',
        snapshot: selectedDraft.properties[propertyIds.bottom],
      },
      {
        id: propertyIds.left,
        key: 'left',
        label: 'L',
        snapshot: selectedDraft.properties[propertyIds.left],
      },
    ];
    const dirtyEntries = entries.filter((entry) => entry.snapshot.value !== entry.snapshot.baseline);
    const invalid = entries.some((entry) => entry.snapshot.invalid);

    return (
      <PropertyCard
        action={
          dirtyEntries.length > 0 ? (
            <button
              data-hawk-eye-ui="control-reset"
              onClick={() => {
                for (const entry of dirtyEntries) {
                  onResetProperty(selectedDraft.instanceKey, entry.id);
                }
              }}
              type="button"
            >
              Reset
            </button>
          ) : null
        }
        dirty={dirtyEntries.length > 0}
        invalid={invalid}
        key={cardId}
        label={label}
        meta={getPerSideMeta(entries)}
        propertyId={cardId}
        span="full"
      >
        <PerSideControl
          key={`${selectedDraft.instanceKey}-${cardId}`}
          label={label}
          onChange={onChange}
          onReset={(propertyId) => onResetProperty(selectedDraft.instanceKey, propertyId)}
          sides={{
            top: { id: propertyIds.top, snapshot: selectedDraft.properties[propertyIds.top] },
            right: { id: propertyIds.right, snapshot: selectedDraft.properties[propertyIds.right] },
            bottom: {
              id: propertyIds.bottom,
              snapshot: selectedDraft.properties[propertyIds.bottom],
            },
            left: { id: propertyIds.left, snapshot: selectedDraft.properties[propertyIds.left] },
          }}
        />
      </PropertyCard>
    );
  }

  function renderBoxShadowCard() {
    const propertyId = 'boxShadow' satisfies EditablePropertyId;
    const definition = editablePropertyDefinitionMap[propertyId];
    const snapshot = selectedDraft.properties[propertyId];
    const dirty = snapshot.value !== snapshot.baseline;

    return (
      <PropertyCard
        action={
          dirty ? (
            <button
              data-hawk-eye-ui="control-reset"
              onClick={() => onResetProperty(selectedDraft.instanceKey, propertyId)}
              type="button"
            >
              Reset
            </button>
          ) : null
        }
        dirty={dirty}
        invalid={snapshot.invalid}
        key={propertyId}
        label={definition.label}
        meta={getSnapshotMeta(snapshot)}
        propertyId={propertyId}
        span="full"
      >
        <BoxShadowInput snapshot={snapshot} onChange={(value) => onChange(propertyId, value)} />
      </PropertyCard>
    );
  }

  function renderLayoutSection() {
    return renderSection(
      'layout',
      focusedGroupLabels.layout,
      'Padding and margin for fast spacing balance.',
      focusedGroupMembers.layout.length,
      <div data-hawk-eye-ui="section-stack">
        {renderPerSideCard('padding', 'Padding', {
          top: 'paddingTop',
          right: 'paddingRight',
          bottom: 'paddingBottom',
          left: 'paddingLeft',
        })}
        {renderPerSideCard('margin', 'Margin', {
          top: 'marginTop',
          right: 'marginRight',
          bottom: 'marginBottom',
          left: 'marginLeft',
        })}
      </div>
    );
  }

  function renderFillSection() {
    return renderSection(
      'fill',
      focusedGroupLabels.fill,
      'Background and text color for the selected layer.',
      focusedGroupMembers.fill.length,
      <div data-hawk-eye-ui="section-grid">
        {renderPropertyCard('backgroundColor')}
        {renderPropertyCard('color')}
      </div>
    );
  }

  function renderTypographySection() {
    return renderSection(
      'typography',
      focusedGroupLabels.typography,
      'Type scale, weight, and alignment only.',
      focusedGroupMembers.typography.length,
      <div data-hawk-eye-ui="section-grid">
        {renderPropertyCard('fontSize')}
        {renderPropertyCard('fontWeight')}
        {renderPropertyCard('textAlign', { span: 'full' })}
      </div>
    );
  }

  function renderDesignSection() {
    return renderSection(
      'design',
      focusedGroupLabels.design,
      'Shape refinement through a single radius control.',
      focusedGroupMembers.design.length,
      <div data-hawk-eye-ui="section-grid">{renderPropertyCard('borderRadius', { span: 'full' })}</div>
    );
  }

  function renderEffectsSection() {
    return renderSection(
      'effects',
      focusedGroupLabels.effects,
      'Depth and softness through a single shadow control.',
      focusedGroupMembers.effects.length,
      <div data-hawk-eye-ui="section-grid">{renderBoxShadowCard()}</div>
    );
  }

  const renderedSections = {
    layout: renderLayoutSection(),
    fill: renderFillSection(),
    typography: renderTypographySection(),
    design: renderDesignSection(),
    effects: renderEffectsSection(),
  } satisfies Record<FocusedGroupId, SectionContent>;

  return (
    <>
      <section data-hawk-eye-ui="property-stack">
        {focusedGroupOrder.map((group) => renderedSections[group].node)}
      </section>

      <section data-hawk-eye-ui="changes-section">
        <div data-hawk-eye-ui="group-header">
          <h3 data-hawk-eye-ui="group-title">Pending changes</h3>
          {dirtyDrafts.length > 0 ? (
            <button data-hawk-eye-ui="secondary-button" onClick={onResetAll} type="button">
              Reset all changes
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
                  <span data-hawk-eye-ui="change-count">{dirtyProperties.length} edits</span>
                </div>

                <div data-hawk-eye-ui="change-items">
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
