import type React from 'react';
import { useState } from 'react';
import type { EditablePropertyId, PropertySnapshot } from '../types';
import { extractLooseNumber, formatCssValue, parseCssValue } from '../utils/css-value';

interface PerSideEntry {
  id: EditablePropertyId;
  snapshot: PropertySnapshot;
}

interface PerSideProps {
  label: string;
  grouping?: 'all-each' | 'opposite-each';
  sides: {
    top: PerSideEntry;
    right: PerSideEntry;
    bottom: PerSideEntry;
    left: PerSideEntry;
  };
  onChange(propertyId: EditablePropertyId, value: string): void;
  onReset?(propertyId: EditablePropertyId): void;
}

function getUnit(snapshot: PropertySnapshot): string {
  return (
    parseCssValue(snapshot.inputValue.trim())?.unit ??
    parseCssValue(snapshot.value.trim())?.unit ??
    'px'
  );
}

function getNumericDisplay(snapshot: PropertySnapshot): string {
  const trimmed = snapshot.inputValue.trim();
  const parsed = parseCssValue(trimmed);
  if (parsed) {
    if (parsed.unit === 'px') {
      return String(Math.round(parsed.number));
    }

    return String(Math.round(parsed.number * 100) / 100);
  }
  return snapshot.inputValue;
}

function buildValue(raw: string, unit: string): string {
  const trimmed = raw.trim();
  if (/^-?(?:\d+|\d*\.\d*)$/.test(trimmed)) return `${trimmed}${unit}`;
  return raw;
}

function LinkIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.5 11.5a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66l-1.14 1.13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M11.5 8.5a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1.13-1.13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function BrokenLinkIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5.5l.47-.47a4 4 0 0 1 5.66 5.66l-.47.47"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M11 14.5l-.47.47a4 4 0 0 1-5.66-5.66l.47-.47"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M7 3v2M3 7h2M17 13h-2M13 17v-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function areAllLinked(entries: PerSideEntry[]) {
  if (entries.length === 0) return true;
  return entries.every((entry) => entry.snapshot.value === entries[0].snapshot.value);
}

function areOppositePairsLinked(sides: PerSideProps['sides']) {
  return (
    sides.top.snapshot.value === sides.bottom.snapshot.value &&
    sides.right.snapshot.value === sides.left.snapshot.value
  );
}

function getStepParsedValue(snapshot: PropertySnapshot, rawValue: string) {
  const nextNumber = extractLooseNumber(rawValue);

  if (nextNumber !== null) {
    return {
      number: nextNumber,
      unit:
        parseCssValue(snapshot.inputValue.trim())?.unit ??
        parseCssValue(snapshot.value.trim())?.unit ??
        'px',
    };
  }

  return parseCssValue(snapshot.inputValue.trim()) ?? parseCssValue(snapshot.value.trim());
}

function handleSingleKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  snapshot: PropertySnapshot,
  onCommit: (raw: string) => void
) {
  if (e.key === 'Escape') {
    onCommit(snapshot.value);
    e.currentTarget.blur();
    return;
  }

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const parsed = getStepParsedValue(snapshot, e.currentTarget.value);
    if (parsed) {
      const next = e.key === 'ArrowUp' ? parsed.number + step : parsed.number - step;
      onCommit(formatCssValue(Math.max(0, next), parsed.unit || 'px'));
    }
  }

  if (e.key === 'Enter') e.currentTarget.blur();
}

export function PerSideControl({
  label,
  grouping = 'all-each',
  sides,
  onChange,
}: PerSideProps) {
  const entries = [
    { key: 'top' as const, ...sides.top },
    { key: 'right' as const, ...sides.right },
    { key: 'bottom' as const, ...sides.bottom },
    { key: 'left' as const, ...sides.left },
  ];

  const [grouped, setGrouped] = useState(() =>
    grouping === 'opposite-each'
      ? areOppositePairsLinked(sides)
      : areAllLinked(entries.map((entry) => ({ id: entry.id, snapshot: entry.snapshot })))
  );

  const allSnapshot = sides.top.snapshot;
  const allUnit = getUnit(allSnapshot);
  const allDisplay = getNumericDisplay(allSnapshot);

  const verticalSnapshot = sides.top.snapshot;
  const verticalUnit = getUnit(verticalSnapshot);
  const verticalDisplay = getNumericDisplay(verticalSnapshot);

  const horizontalSnapshot = sides.right.snapshot;
  const horizontalUnit = getUnit(horizontalSnapshot);
  const horizontalDisplay = getNumericDisplay(horizontalSnapshot);

  function handleAllChange(raw: string) {
    const value = buildValue(raw, allUnit);
    onChange(sides.top.id, value);
    onChange(sides.right.id, value);
    onChange(sides.bottom.id, value);
    onChange(sides.left.id, value);
  }

  function handleOppositeChange(axis: 'vertical' | 'horizontal', raw: string) {
    const unit = axis === 'vertical' ? verticalUnit : horizontalUnit;
    const value = buildValue(raw, unit);

    if (axis === 'vertical') {
      onChange(sides.top.id, value);
      onChange(sides.bottom.id, value);
      return;
    }

    onChange(sides.right.id, value);
    onChange(sides.left.id, value);
  }

  function handleToggleGrouped() {
    const nextGrouped = !grouped;

    if (nextGrouped) {
      if (grouping === 'opposite-each') {
        handleOppositeChange('vertical', verticalDisplay);
        handleOppositeChange('horizontal', horizontalDisplay);
      } else {
        handleAllChange(allDisplay);
      }
    }

    setGrouped(nextGrouped);
  }

  const toggleLabel =
    grouping === 'opposite-each'
      ? grouped
        ? 'Edit each side'
        : 'Edit opposite sides'
      : grouped
        ? 'Unlink sides'
        : 'Link all sides';

  return (
    <div data-hawk-eye-ui="per-side-control">
      <span data-hawk-eye-ui="input-label">{label}</span>
      <div data-hawk-eye-ui="per-side-row">
        {grouped ? (
          grouping === 'opposite-each' ? (
            <div data-hawk-eye-ui="per-side-opposite-pills">
              <div data-hawk-eye-ui="per-side-pill">
                <input
                  aria-label={`${label} vertical sides`}
                  data-hawk-eye-ui="text-input"
                  onChange={(e) => handleOppositeChange('vertical', e.currentTarget.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) =>
                    handleSingleKeyDown(e, verticalSnapshot, (raw) =>
                      handleOppositeChange('vertical', raw)
                    )
                  }
                  placeholder="0"
                  type="text"
                  value={verticalDisplay}
                />
                <span data-hawk-eye-ui="input-unit-label">{verticalUnit}</span>
              </div>
              <div data-hawk-eye-ui="per-side-pill">
                <input
                  aria-label={`${label} horizontal sides`}
                  data-hawk-eye-ui="text-input"
                  onChange={(e) => handleOppositeChange('horizontal', e.currentTarget.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) =>
                    handleSingleKeyDown(e, horizontalSnapshot, (raw) =>
                      handleOppositeChange('horizontal', raw)
                    )
                  }
                  placeholder="0"
                  type="text"
                  value={horizontalDisplay}
                />
                <span data-hawk-eye-ui="input-unit-label">{horizontalUnit}</span>
              </div>
            </div>
          ) : (
            <div data-hawk-eye-ui="per-side-all-input">
              <input
                aria-label={`${label} all sides`}
                data-hawk-eye-ui="text-input"
                onChange={(e) => handleAllChange(e.currentTarget.value)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => handleSingleKeyDown(e, allSnapshot, handleAllChange)}
                placeholder="0"
                type="text"
                value={allDisplay}
              />
              <span data-hawk-eye-ui="input-unit-label">{allUnit}</span>
            </div>
          )
        ) : (
          <div data-hawk-eye-ui="per-side-each-pills">
            {entries.map((entry) => {
              const unit = getUnit(entry.snapshot);
              const display = getNumericDisplay(entry.snapshot);

              return (
                <div data-hawk-eye-ui="per-side-pill" key={entry.key}>
                  <input
                    aria-label={`${label} ${entry.key}`}
                    data-hawk-eye-control={entry.id}
                    data-hawk-eye-ui="text-input"
                    onChange={(e) => onChange(entry.id, buildValue(e.currentTarget.value, unit))}
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyDown={(e) =>
                      handleSingleKeyDown(e, entry.snapshot, (raw) =>
                        onChange(entry.id, buildValue(raw, unit))
                      )
                    }
                    placeholder="0"
                    type="text"
                    value={display}
                  />
                  <span data-hawk-eye-ui="input-unit-label">{unit}</span>
                </div>
              );
            })}
          </div>
        )}

        <button
          aria-label={toggleLabel}
          data-hawk-eye-ui="link-toggle-btn"
          data-linked={grouped ? 'true' : 'false'}
          onClick={handleToggleGrouped}
          type="button"
        >
          {grouped ? <LinkIcon /> : <BrokenLinkIcon />}
        </button>
      </div>
    </div>
  );
}
