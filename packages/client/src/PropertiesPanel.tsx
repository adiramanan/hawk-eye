import { useDeferredValue, useState, type ReactNode } from 'react';
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
const AUTO_LAYOUT_CONTAINER_PROPERTY_IDS = new Set<EditablePropertyId>([
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'gap',
  'rowGap',
  'columnGap',
]);

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
  count: number;
  node: ReactNode | null;
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

function isFlexDisplayValue(value: string) {
  const trimmed = value.trim();

  return trimmed === 'flex' || trimmed === 'inline-flex';
}

export function PropertiesPanel({
  pendingDrafts,
  selectedDraft,
  onChange,
  onResetAll,
  onResetProperty,
}: PropertiesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const searchActive = deferredSearchQuery.length > 0;
  const dirtyDrafts = pendingDrafts.filter((draft) => getDirtyPropertyIds(draft).length > 0);

  function matchesSearch(tokens: Array<string | undefined>) {
    if (!searchActive) {
      return true;
    }

    return tokens.some((token) => token?.toLowerCase().includes(deferredSearchQuery));
  }

  function getPropertySearchTokens(propertyId: EditablePropertyId) {
    const definition = editablePropertyDefinitionMap[propertyId];
    const snapshot = selectedDraft.properties[propertyId];

    return [
      definition.label,
      definition.shortLabel,
      definition.id,
      definition.cssProperty,
      snapshot.inputValue,
      snapshot.value,
      snapshot.baseline,
    ];
  }

  function matchesPropertySearch(propertyId: EditablePropertyId) {
    return matchesSearch(getPropertySearchTokens(propertyId));
  }

  function matchesCompoundSearch(label: string, propertyIds: EditablePropertyId[]) {
    return matchesSearch([
      label,
      ...propertyIds.flatMap((propertyId) => getPropertySearchTokens(propertyId)),
    ]);
  }

  function renderSection(
    sectionId: string,
    title: string,
    subtitle: string,
    count: number,
    layout: ReactNode,
    defaultExpanded = true
  ): SectionContent {
    if (count === 0) {
      return {
        count,
        node: null,
      };
    }

    return {
      count,
      node: (
        <CollapsibleSection
          action={<span data-hawk-eye-ui="section-count">{count}</span>}
          defaultExpanded={defaultExpanded}
          forceExpanded={searchActive}
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

  function renderFallbackGroup(group: EditablePropertyGroupId) {
    const definitions = editablePropertyDefinitions.filter(
      (definition) =>
        definition.group === group &&
        !HIGH_PRIORITY_PROPERTY_IDS.has(definition.id) &&
        matchesPropertySearch(definition.id)
    );

    return renderSection(
      group,
      editablePropertyGroupLabels[group],
      'Lower-priority controls still participate in live preview.',
      definitions.length,
      <div data-hawk-eye-ui="control-grid">{definitions.map((definition) => renderPropertyCard(definition.id))}</div>,
      DEFAULT_EXPANDED_GROUPS.includes(group)
    );
  }

  function renderSpacingSection() {
    const cards = [
      matchesCompoundSearch('Padding', [
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
      ])
        ? renderPerSideCard('padding', 'Padding', {
            top: 'paddingTop',
            right: 'paddingRight',
            bottom: 'paddingBottom',
            left: 'paddingLeft',
          })
        : null,
      matchesCompoundSearch('Margin', ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'])
        ? renderPerSideCard('margin', 'Margin', {
            top: 'marginTop',
            right: 'marginRight',
            bottom: 'marginBottom',
            left: 'marginLeft',
          })
        : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'spacing',
      'Spacing',
      'Padding and margin, grouped for quick balance changes.',
      cards.length,
      <div data-hawk-eye-ui="section-stack">{cards}</div>
    );
  }

  function renderFillAppearanceSection() {
    const cards = [
      matchesPropertySearch('backgroundColor') ? renderPropertyCard('backgroundColor') : null,
      matchesPropertySearch('color') ? renderPropertyCard('color') : null,
      matchesPropertySearch('opacity') ? renderPropertyCard('opacity') : null,
      matchesCompoundSearch('Corner radius', [
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderBottomRightRadius',
        'borderBottomLeftRadius',
      ])
        ? renderPerSideCard('cornerRadius', 'Corner radius', {
            top: 'borderTopLeftRadius',
            right: 'borderTopRightRadius',
            bottom: 'borderBottomRightRadius',
            left: 'borderBottomLeftRadius',
          })
        : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'fill-appearance',
      'Fill & Appearance',
      'Color, opacity, and surface shape in one place.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderTypographySection() {
    const cards = [
      matchesPropertySearch('fontFamily') ? renderPropertyCard('fontFamily', { span: 'full' }) : null,
      matchesPropertySearch('fontSize') ? renderPropertyCard('fontSize') : null,
      matchesPropertySearch('fontWeight') ? renderPropertyCard('fontWeight') : null,
      matchesPropertySearch('lineHeight') ? renderPropertyCard('lineHeight') : null,
      matchesPropertySearch('letterSpacing') ? renderPropertyCard('letterSpacing') : null,
      matchesPropertySearch('textAlign') ? renderPropertyCard('textAlign', { span: 'full' }) : null,
      matchesPropertySearch('textDecoration') ? renderPropertyCard('textDecoration') : null,
      matchesPropertySearch('textTransform') ? renderPropertyCard('textTransform') : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'typography',
      'Typography',
      'Type system controls, from family and scale to alignment.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderSizeSection() {
    const cards = [
      matchesPropertySearch('width') ? renderPropertyCard('width') : null,
      matchesPropertySearch('height') ? renderPropertyCard('height') : null,
      matchesPropertySearch('minWidth') ? renderPropertyCard('minWidth', { compact: true }) : null,
      matchesPropertySearch('maxWidth') ? renderPropertyCard('maxWidth', { compact: true }) : null,
      matchesPropertySearch('minHeight')
        ? renderPropertyCard('minHeight', { compact: true })
        : null,
      matchesPropertySearch('maxHeight')
        ? renderPropertyCard('maxHeight', { compact: true })
        : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'size',
      'Size',
      'Primary dimensions plus guardrails for responsive bounds.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderLayoutSection() {
    const cards = [
      matchesPropertySearch('display') ? renderPropertyCard('display') : null,
      matchesPropertySearch('overflow') ? renderPropertyCard('overflow') : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'layout-priority',
      'Layout',
      'Broad layout behavior before moving into position or auto layout.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderStrokeSection() {
    const cards = [
      matchesPropertySearch('borderColor') ? renderPropertyCard('borderColor') : null,
      matchesPropertySearch('borderStyle') ? renderPropertyCard('borderStyle') : null,
      matchesCompoundSearch('Border width', [
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
      ])
        ? renderPerSideCard('borderWidth', 'Border width', {
            top: 'borderTopWidth',
            right: 'borderRightWidth',
            bottom: 'borderBottomWidth',
            left: 'borderLeftWidth',
          })
        : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'stroke',
      'Stroke & Border',
      'Edge treatment, color, and per-side widths.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderEffectsSection() {
    const cards = [
      matchesPropertySearch('boxShadow') ? renderBoxShadowCard() : null,
      matchesPropertySearch('filter') ? renderPropertyCard('filter') : null,
      matchesPropertySearch('backdropFilter') ? renderPropertyCard('backdropFilter') : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'effects',
      'Effects',
      'Shadow, filter, and backdrop treatment for depth.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderPositionSection() {
    const cards = [
      matchesPropertySearch('positionType') ? renderPropertyCard('positionType') : null,
      matchesPropertySearch('zIndex') ? renderPropertyCard('zIndex') : null,
      matchesPropertySearch('top') ? renderPropertyCard('top', { compact: true }) : null,
      matchesPropertySearch('right') ? renderPropertyCard('right', { compact: true }) : null,
      matchesPropertySearch('bottom') ? renderPropertyCard('bottom', { compact: true }) : null,
      matchesPropertySearch('left') ? renderPropertyCard('left', { compact: true }) : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'position',
      'Position',
      'Layering and offsets for precise placement.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  function renderAutoLayoutSection() {
    const autoLayoutDisplaySnapshot = selectedDraft.properties.display;
    const updateAutoLayoutProperty = (propertyId: EditablePropertyId, value: string) => {
      if (
        AUTO_LAYOUT_CONTAINER_PROPERTY_IDS.has(propertyId) &&
        autoLayoutDisplaySnapshot.value === autoLayoutDisplaySnapshot.baseline &&
        !isFlexDisplayValue(autoLayoutDisplaySnapshot.baseline)
      ) {
        onChange('display', 'flex');
      }

      onChange(propertyId, value);
    };
    const cards = [
      matchesPropertySearch('flexDirection')
        ? renderPropertyCard('flexDirection', { span: 'full' }, updateAutoLayoutProperty)
        : null,
      matchesPropertySearch('flexWrap')
        ? renderPropertyCard('flexWrap', {}, updateAutoLayoutProperty)
        : null,
      matchesPropertySearch('justifyContent')
        ? renderPropertyCard('justifyContent', { span: 'full' }, updateAutoLayoutProperty)
        : null,
      matchesPropertySearch('alignItems')
        ? renderPropertyCard('alignItems', { span: 'full' }, updateAutoLayoutProperty)
        : null,
      matchesPropertySearch('alignSelf') ? renderPropertyCard('alignSelf') : null,
      matchesPropertySearch('gap') ? renderPropertyCard('gap', {}, updateAutoLayoutProperty) : null,
      matchesPropertySearch('rowGap')
        ? renderPropertyCard('rowGap', { compact: true }, updateAutoLayoutProperty)
        : null,
      matchesPropertySearch('columnGap')
        ? renderPropertyCard('columnGap', { compact: true }, updateAutoLayoutProperty)
        : null,
    ].filter(Boolean) as ReactNode[];

    return renderSection(
      'auto-layout',
      'Auto Layout',
      'Flow, alignment, and spacing for flex containers. Preview promotes non-flex containers to flex.',
      cards.length,
      <div data-hawk-eye-ui="section-grid">{cards}</div>
    );
  }

  const renderedSections = [
    renderSpacingSection().node,
    renderFillAppearanceSection().node,
    renderTypographySection().node,
    renderSizeSection().node,
    renderLayoutSection().node,
    renderStrokeSection().node,
    renderEffectsSection().node,
    renderPositionSection().node,
    renderAutoLayoutSection().node,
    ...editablePropertyGroupOrder
      .map((group) => renderFallbackGroup(group).node)
      .filter(Boolean),
  ].filter(Boolean) as ReactNode[];

  const matchingPropertyCount = editablePropertyDefinitions.filter((definition) =>
    matchesPropertySearch(definition.id)
  ).length;

  return (
    <>
      <section data-hawk-eye-ui="panel-toolbar">
        <label data-hawk-eye-ui="search-shell">
          <span data-hawk-eye-ui="search-label">Find property</span>
          <div data-hawk-eye-ui="search-row">
            <span aria-hidden="true" data-hawk-eye-ui="search-icon">
              /
            </span>
            <input
              aria-label="Search properties"
              data-hawk-eye-control="property-search"
              data-hawk-eye-ui="text-input"
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder="Search label, CSS property, or current value"
              type="text"
              value={searchQuery}
            />
            {searchActive ? (
              <button
                data-hawk-eye-control="property-search-clear"
                data-hawk-eye-ui="pill-button"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                Clear
              </button>
            ) : null}
          </div>
        </label>
        <p data-hawk-eye-ui="search-meta">
          {searchActive
            ? `${matchingPropertyCount} matching properties`
            : `${editablePropertyDefinitions.length} editable properties`}
        </p>
      </section>

      <section data-hawk-eye-ui="property-stack">
        {renderedSections.length > 0 ? (
          renderedSections
        ) : (
          <div data-hawk-eye-ui="search-empty">
            <p data-hawk-eye-ui="hint">
              No editable properties match &quot;{searchQuery.trim()}&quot;.
            </p>
            <button
              data-hawk-eye-ui="secondary-button"
              onClick={() => setSearchQuery('')}
              type="button"
            >
              Clear search
            </button>
          </div>
        )}
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
                        <div
                          data-hawk-eye-ui="change-item"
                          key={`${draft.instanceKey}-${propertyId}`}
                        >
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
