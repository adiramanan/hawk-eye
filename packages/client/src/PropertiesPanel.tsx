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
  editablePropertyDefinitionMap,
  editablePropertyDefinitions,
  editablePropertyGroupLabels,
  editablePropertyGroupOrder,
} from './editable-properties';
import { getDirtyPropertyIds } from './drafts';
import { CollapsibleSection, PropertyCard } from './sections';
import type {
  EditablePropertyDefinition,
  EditablePropertyGroupId,
  EditablePropertyId,
  PropertySnapshot,
  SelectionDraft,
} from './types';

const DEFAULT_EXPANDED_GROUPS: EditablePropertyGroupId[] = [
  'spacing',
  'fill',
  'typography',
  'appearance',
];

const HIGH_PRIORITY_PROPERTY_IDS = new Set<EditablePropertyId>([
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'backgroundColor',
  'color',
  'opacity',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textDecoration',
  'textTransform',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'display',
  'positionType',
  'overflow',
  'zIndex',
  'borderColor',
  'borderStyle',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'boxShadow',
  'filter',
  'backdropFilter',
  'top',
  'right',
  'bottom',
  'left',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignSelf',
  'gap',
  'rowGap',
  'columnGap',
]);

interface PropertiesPanelProps {
  pendingDrafts: SelectionDraft[];
  selectedDraft: SelectionDraft;
  onChange(propertyId: EditablePropertyId, value: string): void;
  onResetAll(): void;
  onResetProperty(source: string, propertyId: EditablePropertyId): void;
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

function getPerSideMeta(
  entries: Array<{ label: string; snapshot: PropertySnapshot }>
) {
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

export function PropertiesPanel({
  pendingDrafts,
  selectedDraft,
  onChange,
  onResetAll,
  onResetProperty,
}: PropertiesPanelProps) {
  const dirtyDrafts = pendingDrafts.filter((draft) => getDirtyPropertyIds(draft).length > 0);

  function renderPropertyCard(propertyId: EditablePropertyId, options: PropertyCardOptions = {}) {
    const definition = editablePropertyDefinitionMap[propertyId];
    const snapshot = selectedDraft.properties[propertyId];
    const dirty = snapshot.value !== snapshot.baseline;

    return (
      <PropertyCard
        action={
          dirty ? (
            <button
              data-hawk-eye-ui="control-reset"
              onClick={() => onResetProperty(selectedDraft.source, propertyId)}
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
        {renderControl(definition, snapshot, (value) => onChange(propertyId, value))}
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
                  onResetProperty(selectedDraft.source, entry.id);
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
          key={`${selectedDraft.source}-${cardId}`}
          label={label}
          onChange={onChange}
          onReset={(propertyId) => onResetProperty(selectedDraft.source, propertyId)}
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
              onClick={() => onResetProperty(selectedDraft.source, propertyId)}
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

  function renderFallbackGroup(group: EditablePropertyGroupId) {
    const definitions = editablePropertyDefinitions.filter(
      (definition) => definition.group === group && !HIGH_PRIORITY_PROPERTY_IDS.has(definition.id)
    );

    if (definitions.length === 0) {
      return null;
    }

    return (
      <CollapsibleSection
        defaultExpanded={DEFAULT_EXPANDED_GROUPS.includes(group)}
        key={group}
        sectionId={group}
        title={editablePropertyGroupLabels[group]}
      >
        <div data-hawk-eye-ui="control-grid">
          {definitions.map((definition) => renderPropertyCard(definition.id))}
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <>
      <section data-hawk-eye-ui="property-stack">
        <CollapsibleSection defaultExpanded sectionId="spacing" title="Spacing">
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
        </CollapsibleSection>

        <CollapsibleSection
          defaultExpanded
          sectionId="fill-appearance"
          title="Fill & Appearance"
        >
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('backgroundColor')}
            {renderPropertyCard('color')}
            {renderPropertyCard('opacity')}
            {renderPerSideCard('cornerRadius', 'Corner radius', {
              top: 'borderTopLeftRadius',
              right: 'borderTopRightRadius',
              bottom: 'borderBottomRightRadius',
              left: 'borderBottomLeftRadius',
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="typography" title="Typography">
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('fontFamily', { span: 'full' })}
            {renderPropertyCard('fontSize')}
            {renderPropertyCard('fontWeight')}
            {renderPropertyCard('lineHeight')}
            {renderPropertyCard('letterSpacing')}
            {renderPropertyCard('textAlign', { span: 'full' })}
            {renderPropertyCard('textDecoration')}
            {renderPropertyCard('textTransform')}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="size" title="Size">
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('width')}
            {renderPropertyCard('height')}
            {renderPropertyCard('minWidth', { compact: true })}
            {renderPropertyCard('maxWidth', { compact: true })}
            {renderPropertyCard('minHeight', { compact: true })}
            {renderPropertyCard('maxHeight', { compact: true })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="layout-priority" title="Layout">
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('display')}
            {renderPropertyCard('overflow')}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="stroke" title="Stroke & Border">
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('borderColor')}
            {renderPropertyCard('borderStyle')}
            {renderPerSideCard('borderWidth', 'Border width', {
              top: 'borderTopWidth',
              right: 'borderRightWidth',
              bottom: 'borderBottomWidth',
              left: 'borderLeftWidth',
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="effects" title="Effects">
          <div data-hawk-eye-ui="section-grid">
            {renderBoxShadowCard()}
            {renderPropertyCard('filter')}
            {renderPropertyCard('backdropFilter')}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="position" title="Position">
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('positionType')}
            {renderPropertyCard('zIndex')}
            {renderPropertyCard('top', { compact: true })}
            {renderPropertyCard('right', { compact: true })}
            {renderPropertyCard('bottom', { compact: true })}
            {renderPropertyCard('left', { compact: true })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection defaultExpanded sectionId="auto-layout" title="Auto Layout">
          <div data-hawk-eye-ui="section-grid">
            {renderPropertyCard('flexDirection', { span: 'full' })}
            {renderPropertyCard('flexWrap')}
            {renderPropertyCard('justifyContent', { span: 'full' })}
            {renderPropertyCard('alignItems', { span: 'full' })}
            {renderPropertyCard('alignSelf')}
            {renderPropertyCard('gap')}
            {renderPropertyCard('rowGap', { compact: true })}
            {renderPropertyCard('columnGap', { compact: true })}
          </div>
        </CollapsibleSection>

        {editablePropertyGroupOrder.map((group) => renderFallbackGroup(group))}
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
            {dirtyDrafts.map((draft) => {
              const dirtyProperties = getDirtyPropertyIds(draft);

              return (
                <article data-hawk-eye-ui="change-card" key={draft.source}>
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
                        <div data-hawk-eye-ui="change-item" key={`${draft.source}-${propertyId}`}>
                          <div data-hawk-eye-ui="change-copy">
                            <span data-hawk-eye-ui="change-label">{definition.shortLabel}</span>
                            <span data-hawk-eye-ui="change-values">
                              {renderValue(snapshot.baseline)} {'->'} {renderValue(snapshot.value)}
                            </span>
                          </div>
                          <button
                            data-hawk-eye-ui="pill-button"
                            onClick={() => onResetProperty(draft.source, propertyId)}
                            type="button"
                          >
                            Reset
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
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
