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

/** Chain-link icon (linked state) */
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

/** Broken chain-link icon (unlinked state) */
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
      <path d="M7 3v2M3 7h2M17 13h-2M13 17v-2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
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

        <button
          aria-label={linked ? 'Unlink sides' : 'Link all sides'}
          data-hawk-eye-ui="link-toggle-btn"
          data-linked={linked ? 'true' : 'false'}
          onClick={() => setLinked(!linked)}
          type="button"
        >
          {linked ? <LinkIcon /> : <BrokenLinkIcon />}
        </button>
      </div>
    </div>
  );
}
