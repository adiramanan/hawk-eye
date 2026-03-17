import type React from 'react';
import { useState } from 'react';
import type { EditablePropertyId, PropertySnapshot } from '../types';
import { formatCssValue, parseCssValue } from '../utils/css-value';

interface PerSideEntry {
  id: EditablePropertyId;
  snapshot: PropertySnapshot;
}

interface PerSideProps {
  label: string;
  sides: {
    top: PerSideEntry;
    right: PerSideEntry;
    bottom: PerSideEntry;
    left: PerSideEntry;
  };
  onChange(propertyId: EditablePropertyId, value: string): void;
  onReset?(propertyId: EditablePropertyId): void;
}

function areLinked(entries: PerSideEntry[]) {
  if (entries.length === 0) return true;
  return entries.every((e) => e.snapshot.value === entries[0].snapshot.value);
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
  if (parsed) return String(parsed.number);
  return snapshot.inputValue;
}

function buildValue(raw: string, unit: string): string {
  const trimmed = raw.trim();
  if (/^-?(?:\d+|\d*\.\d*)$/.test(trimmed)) return `${trimmed}${unit}`;
  return raw;
}

export function PerSideControl({ label, sides, onChange }: PerSideProps) {
  const entries = [
    { key: 'top' as const, ...sides.top },
    { key: 'right' as const, ...sides.right },
    { key: 'bottom' as const, ...sides.bottom },
    { key: 'left' as const, ...sides.left },
  ];

  const [linked, setLinked] = useState(() =>
    areLinked(entries.map((e) => ({ id: e.id, snapshot: e.snapshot })))
  );

  const allSnapshot = sides.top.snapshot;
  const allUnit = getUnit(allSnapshot);
  const allDisplay = getNumericDisplay(allSnapshot);

  function handleAllChange(raw: string) {
    const val = buildValue(raw, allUnit);
    onChange(sides.top.id, val);
    onChange(sides.right.id, val);
    onChange(sides.bottom.id, val);
    onChange(sides.left.id, val);
  }

  function handleAllKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      handleAllChange(allSnapshot.value);
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const parsed =
        parseCssValue(allSnapshot.inputValue.trim()) ??
        parseCssValue(allSnapshot.value.trim());
      if (parsed) {
        const next =
          e.key === 'ArrowUp' ? parsed.number + step : parsed.number - step;
        handleAllChange(formatCssValue(Math.max(0, next), parsed.unit || 'px'));
      }
    }
    if (e.key === 'Enter') e.currentTarget.blur();
  }

  return (
    <div data-hawk-eye-ui="per-side-control">
      <span data-hawk-eye-ui="input-label">{label}</span>
      <div data-hawk-eye-ui="per-side-row">
        <select
          aria-label="All sides or each side"
          data-hawk-eye-ui="select-input"
          onChange={(e) => setLinked(e.currentTarget.value === 'all')}
          value={linked ? 'all' : 'each'}
        >
          <option value="all">All</option>
          <option value="each">Each</option>
        </select>

        {linked ? (
          <div data-hawk-eye-ui="per-side-all-input">
            <input
              aria-label={`${label} all sides`}
              data-hawk-eye-ui="text-input"
              onChange={(e) => handleAllChange(e.currentTarget.value)}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={handleAllKeyDown}
              placeholder="0"
              type="text"
              value={allDisplay}
            />
            <span data-hawk-eye-ui="input-unit-label">{allUnit}</span>
          </div>
        ) : (
          <div data-hawk-eye-ui="per-side-each-inputs">
            {entries.map((entry) => {
              const unit = getUnit(entry.snapshot);
              const display = getNumericDisplay(entry.snapshot);
              return (
                <div data-hawk-eye-ui="per-side-each-cell" key={entry.key}>
                  <input
                    aria-label={`${label} ${entry.key}`}
                    data-hawk-eye-control={entry.id}
                    data-hawk-eye-ui="text-input"
                    onChange={(e) =>
                      onChange(entry.id, buildValue(e.currentTarget.value, unit))
                    }
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onChange(entry.id, entry.snapshot.value);
                        e.currentTarget.blur();
                      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const step = e.shiftKey ? 10 : 1;
                        const parsed =
                          parseCssValue(entry.snapshot.inputValue.trim()) ??
                          parseCssValue(entry.snapshot.value.trim());
                        if (parsed) {
                          const next =
                            e.key === 'ArrowUp'
                              ? parsed.number + step
                              : parsed.number - step;
                          onChange(
                            entry.id,
                            formatCssValue(Math.max(0, next), parsed.unit || 'px')
                          );
                        }
                      } else if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
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
      </div>
    </div>
  );
}
