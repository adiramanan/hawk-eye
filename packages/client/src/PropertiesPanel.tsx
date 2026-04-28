import { type ReactNode } from 'react';
import alignCenterIconInactive from './icons/Icon=Align Center Icon, Style=inactive.svg';
import alignCenterIconNormal from './icons/Icon=Align Center Icon, Style=normal.svg';
import alignJustifyIconInactive from './icons/Icon=Align Justify Icon, Style=inactive.svg';
import alignJustifyIconNormal from './icons/Icon=Align Justify Icon, Style=normal.svg';
import alignLeftIconInactive from './icons/Icon=Align Left Icon, Style=inactive.svg';
import alignLeftIconNormal from './icons/Icon=Align Left Icon, Style=normal.svg';
import alignRightIconInactive from './icons/Icon=Align Right Icon, Style=inactive.svg';
import alignRightIconNormal from './icons/Icon=Align Right Icon, Style=normal.svg';
import {
  ColorInput,
  FillInput,
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

function getVisibleClassScopedPropertyIds(_selectedDraft: SelectionDraft) {
  return null;
}

function shouldShowProperty(
  propertyId: EditablePropertyId,
  visiblePropertyIds: ReadonlySet<EditablePropertyId> | null
): boolean {
  return V1_PROPERTIES.includes(propertyId) && (!visiblePropertyIds || visiblePropertyIds.has(propertyId));
}

function shouldShowAnyProperty(
  propertyIds: readonly EditablePropertyId[],
  visiblePropertyIds: ReadonlySet<EditablePropertyId> | null
) {
  return propertyIds.some((propertyId) => shouldShowProperty(propertyId, visiblePropertyIds));
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
  isPropertyVisible(propertyId: EditablePropertyId): boolean;
  areAnyPropertiesVisible(propertyIds: readonly EditablePropertyId[]): boolean;
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
const PADDING_PROPERTY_IDS = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
] as const satisfies readonly EditablePropertyId[];
const MARGIN_PROPERTY_IDS = [
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
] as const satisfies readonly EditablePropertyId[];
const CORNER_RADIUS_PROPERTY_IDS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
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

  if (classTargets.length === 0 || selectedDraft.detached) {
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
      <div data-hawk-eye-ui="class-target-field">
        <div data-hawk-eye-ui="class-target-copy">
          <span data-hawk-eye-ui="class-target-label">Editing Class :</span>
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
        </div>
      </div>
      <button
        data-hawk-eye-ui="class-target-detach-button"
        onClick={onDetach}
        type="button"
      >
        Detach
      </button>
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

// ── Layout Section ───────────────────────────────────────────────────────

function LayoutSection(_props: SectionProps) {
  // All layout properties (display, flexDirection, etc.) are deferred to v2+
  return null;
}

// ── Spacing Section ──────────────────────────────────────────────────────

function SizeSpacingSection(props: SectionProps) {
  const showPadding = props.areAnyPropertiesVisible(PADDING_PROPERTY_IDS);
  const showMargin = props.areAnyPropertiesVisible(MARGIN_PROPERTY_IDS);

  if (!showPadding && !showMargin) {
    return null;
  }

  return (
    <CollapsibleSection
      defaultExpanded
      key="sizeSpacing"
      sectionId="positionSize"
      title="Spacing"
    >
      <div data-hawk-eye-ui="section-stack">
        {showPadding ? (
          <PerSideCard
            cardId="padding"
            label="Padding"
            onChange={props.onChange}
            onResetProperty={props.onResetProperty}
            propertyIds={{ top: 'paddingTop', right: 'paddingRight', bottom: 'paddingBottom', left: 'paddingLeft' }}
            selectedDraft={props.selectedDraft}
          />
        ) : null}

        {showMargin ? (
          <PerSideCard
            cardId="margin"
            label="Margin"
            onChange={props.onChange}
            onResetProperty={props.onResetProperty}
            propertyIds={{ top: 'marginTop', right: 'marginRight', bottom: 'marginBottom', left: 'marginLeft' }}
            selectedDraft={props.selectedDraft}
          />
        ) : null}
      </div>
    </CollapsibleSection>
  );
}

// ── Appearance Section ───────────────────────────────────────────────────

function AppearanceSection(props: SectionProps) {
  const shouldHideFillColor = hasExplicitNonSolidAppearanceFill(props.selectedDraft);
  const showBackgroundColor =
    shouldShowAppearanceFill(props.selectedDraft) &&
    props.isPropertyVisible('backgroundColor') &&
    !shouldHideFillColor;
  const showCornerRadius =
    shouldShowCornerRadius(props.selectedDraft.context) &&
    props.areAnyPropertiesVisible(CORNER_RADIUS_PROPERTY_IDS);
  const showOpacity = props.isPropertyVisible('opacity');
  const showBlendMode = props.isPropertyVisible('mixBlendMode');

  if (!showBackgroundColor && !showCornerRadius && !showOpacity && !showBlendMode) {
    return null;
  }

  return (
    <CollapsibleSection
      defaultExpanded
      key="appearance"
      sectionId="fillOpacity"
      title="Appearance"
    >
      <div data-hawk-eye-ui="section-stack">
        {showBackgroundColor ? (
          <div data-hawk-eye-ui="compact-row-full">
            {card('backgroundColor', props)}
          </div>
        ) : null}

        {showCornerRadius ? (
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
        ) : null}

        {showOpacity || showBlendMode ? (
          <div data-appearance-row="true" data-hawk-eye-ui="labelled-row">
            {showOpacity ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Opacity</span>
                {card('opacity', props)}
              </div>
            ) : null}
            {showBlendMode ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Blending Mode</span>
                {card('mixBlendMode', props)}
              </div>
            ) : null}
          </div>
        ) : null}

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
  const showFontFamily = props.isPropertyVisible('fontFamily');
  const showColor = props.isPropertyVisible('color');
  const showFontWeight = props.isPropertyVisible('fontWeight');
  const showFontSize = props.isPropertyVisible('fontSize');
  const showLineHeight = props.isPropertyVisible('lineHeight');
  const showLetterSpacing = props.isPropertyVisible('letterSpacing');
  const showTextAlign = props.isPropertyVisible('textAlign');
  const showTextDecoration = props.isPropertyVisible('textDecoration');
  const showTextTransform = props.isPropertyVisible('textTransform');
  const showWhiteSpace = props.isPropertyVisible('whiteSpace');
  const showTextOverflow = props.isPropertyVisible('textOverflow');
  const showWordBreak = props.isPropertyVisible('wordBreak');
  const showOverflowWrap = props.isPropertyVisible('overflowWrap');
  const showLineClamp = props.isPropertyVisible('lineClamp');

  const typographyProps: SectionProps = {
    ...props,
    onChange(propertyId, value) {
      props.onChange(propertyId, value);
      if (propertyId === 'lineClamp' && value && value !== 'none' && value !== '0') {
        props.onChange('overflow', 'hidden');
      }
    },
  };

  if (
    !showFontFamily &&
    !showColor &&
    !showFontWeight &&
    !showFontSize &&
    !showLineHeight &&
    !showLetterSpacing &&
    !showTextAlign &&
    !showTextDecoration &&
    !showTextTransform &&
    !showWhiteSpace &&
    !showTextOverflow &&
    !showWordBreak &&
    !showOverflowWrap &&
    !showLineClamp
  ) {
    return null;
  }

  return (
    <CollapsibleSection
      defaultExpanded
      key="typography"
      sectionId="typography"
      title={focusedGroupLabels.typography}
    >
      <div data-hawk-eye-ui="section-stack">
        {showFontFamily && (
          <div data-hawk-eye-ui="compact-row-full">
            {card('fontFamily', props)}
          </div>
        )}

        {showColor && (
          <div data-hawk-eye-ui="compact-row-full">
            {card('color', props)}
          </div>
        )}

        {showFontWeight || showFontSize ? (
          <div data-hawk-eye-ui="compact-row">
            {showFontWeight ? card('fontWeight', props) : null}
            {showFontSize ? card('fontSize', props) : null}
          </div>
        ) : null}

        {showLineHeight || showLetterSpacing ? (
          <div data-hawk-eye-ui="labelled-row">
            {showLineHeight ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Line height</span>
                {card('lineHeight', props)}
              </div>
            ) : null}
            {showLetterSpacing ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Letter Spacing</span>
                {card('letterSpacing', props)}
              </div>
            ) : null}
          </div>
        ) : null}

        {showTextAlign ? (
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
        ) : null}

        {(showTextDecoration || showTextTransform) ? (
          <div data-hawk-eye-ui="labelled-row">
            {showTextDecoration ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Decoration</span>
                {card('textDecoration', props)}
              </div>
            ) : null}
            {showTextTransform ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Case</span>
                {card('textTransform', props)}
              </div>
            ) : null}
          </div>
        ) : null}

        {(showWhiteSpace || showTextOverflow) ? (
          <div data-hawk-eye-ui="labelled-row">
            {showWhiteSpace ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">White space</span>
                {card('whiteSpace', typographyProps)}
              </div>
            ) : null}
            {showTextOverflow ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Text overflow</span>
                {card('textOverflow', typographyProps)}
              </div>
            ) : null}
          </div>
        ) : null}

        {(showWordBreak || showOverflowWrap) ? (
          <div data-hawk-eye-ui="labelled-row">
            {showWordBreak ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Word break</span>
                {card('wordBreak', typographyProps)}
              </div>
            ) : null}
            {showOverflowWrap ? (
              <div data-hawk-eye-ui="labelled-col">
                <span data-hawk-eye-ui="input-label">Overflow wrap</span>
                {card('overflowWrap', typographyProps)}
              </div>
            ) : null}
          </div>
        ) : null}

        {showLineClamp ? (
          <div data-hawk-eye-ui="labelled-single">
            <span data-hawk-eye-ui="input-label">Line clamp</span>
            {card('lineClamp', typographyProps)}
          </div>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}

function BorderSection(props: SectionProps) {
  const borderStyleSnapshot = props.selectedDraft.properties.borderStyle;
  const borderStyleValue = getSnapshotDisplayValue(borderStyleSnapshot);
  const hasStroke = isVisibleBorderStyle(borderStyleValue);
  const showBorderStyle = props.isPropertyVisible('borderStyle');
  const showBorderColor = props.isPropertyVisible('borderColor');
  const showBorderWidth = props.areAnyPropertiesVisible(BORDER_WIDTH_PROPERTY_IDS);

  if (!showBorderStyle && !showBorderColor && !showBorderWidth) {
    return null;
  }

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
        {showBorderStyle ? card('borderStyle', borderProps) : null}
        {hasStroke && (
          <>
            {showBorderColor ? card('borderColor', borderProps) : null}
            {showBorderWidth ? (
              <PerSideCard
                cardId="borderWidth"
                label="Stroke Weight"
                onChange={borderProps.onChange}
                onResetProperty={borderProps.onResetProperty}
                propertyIds={{ top: 'borderTopWidth', right: 'borderRightWidth', bottom: 'borderBottomWidth', left: 'borderLeftWidth' }}
                selectedDraft={borderProps.selectedDraft}
              />
            ) : null}
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
  const visiblePropertyIds = getVisibleClassScopedPropertyIds(selectedDraft);
  const sectionProps: SectionProps = {
    selectedDraft,
    isPropertyVisible(propertyId) {
      return shouldShowProperty(propertyId, visiblePropertyIds);
    },
    areAnyPropertiesVisible(propertyIds) {
      return shouldShowAnyProperty(propertyIds, visiblePropertyIds);
    },
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
