import type React from 'react';
import { useState } from 'react';
import type { EditablePropertyId, PropertySnapshot } from '../types';
import { formatCssValue, parseCssValue } from '../utils/css-value';

interface PerCornerEntry {
  id: EditablePropertyId;
  snapshot: PropertySnapshot;
}

interface PerCornerProps {
  label: string;
  corners: {
    topLeft: PerCornerEntry;
    topRight: PerCornerEntry;
    bottomRight: PerCornerEntry;
    bottomLeft: PerCornerEntry;
  };
  onChange(propertyId: EditablePropertyId, value: string): void;
  onReset?(propertyId: EditablePropertyId): void;
}

function areLinked(entries: PerCornerEntry[]) {
  if (entries.length === 0) return true;
  return entries.every((entry) => entry.snapshot.value === entries[0].snapshot.value);
}

export function PerCornerControl({ label, corners, onChange, onReset }: PerCornerProps) {
  const entries = [
    { key: 'topLeft' as const, label: 'TL', ...corners.topLeft },
    { key: 'topRight' as const, label: 'TR', ...corners.topRight },
    { key: 'bottomRight' as const, label: 'BR', ...corners.bottomRight },
    { key: 'bottomLeft' as const, label: 'BL', ...corners.bottomLeft },
  ];
  const [linked, setLinked] = useState(() =>
    areLinked(entries.map((e) => ({ id: e.id, snapshot: e.snapshot })))
  );

  const allSnapshot = corners.topLeft.snapshot;

  function handleAllChange(value: string) {
    onChange(corners.topLeft.id, value);
    onChange(corners.topRight.id, value);
    onChange(corners.bottomRight.id, value);
    onChange(corners.bottomLeft.id, value);
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
      const parsed = parseCssValue(allSnapshot.inputValue.trim()) ?? parseCssValue(allSnapshot.value.trim());
      if (parsed) {
        const next = e.key === 'ArrowUp' ? parsed.number + step : parsed.number - step;
        handleAllChange(formatCssValue(Math.max(0, next), parsed.unit || 'px'));
      }
      return;
    }
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  return (
    <div data-hawk-eye-ui="per-side-control">
      <div data-hawk-eye-ui="per-side-header">
        <span data-hawk-eye-ui="per-side-label">{label}</span>
        <button
          aria-label={linked ? 'Edit corners independently' : 'Link corners together'}
          data-active={linked ? 'true' : 'false'}
          data-hawk-eye-ui="per-side-link"
          onClick={() => setLinked(!linked)}
          type="button"
        >
          {linked ? 'All' : 'Each'}
        </button>
      </div>

      {linked ? (
        <input
          aria-label={`${label} all corners`}
          data-hawk-eye-ui="text-input"
          onChange={(e) => handleAllChange(e.currentTarget.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={handleAllKeyDown}
          placeholder="0px"
          type="text"
          value={allSnapshot.inputValue}
        />
      ) : (
        <div data-hawk-eye-ui="per-side-inputs">
          {entries.map((entry) => (
            <div
              data-dirty={entry.snapshot.value !== entry.snapshot.baseline ? 'true' : 'false'}
              data-hawk-eye-ui="per-side-cell"
              data-invalid={entry.snapshot.invalid ? 'true' : 'false'}
              data-property-id={entry.id}
              key={entry.key}
            >
              <label data-hawk-eye-ui="per-side-input-wrap">
                <span data-hawk-eye-ui="per-side-input-label">{entry.label}</span>
                <input
                  aria-label={`${label} ${entry.label}`}
                  data-hawk-eye-control={entry.id}
                  data-hawk-eye-ui="text-input"
                  onChange={(event) => onChange(entry.id, event.currentTarget.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      onChange(entry.id, entry.snapshot.value);
                      e.currentTarget.blur();
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const step = e.shiftKey ? 10 : 1;
                      const parsed = parseCssValue(entry.snapshot.inputValue.trim()) ?? parseCssValue(entry.snapshot.value.trim());
                      if (parsed) {
                        const next = e.key === 'ArrowUp' ? parsed.number + step : parsed.number - step;
                        onChange(entry.id, formatCssValue(Math.max(0, next), parsed.unit || 'px'));
                      }
                    } else if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="0px"
                  type="text"
                  value={entry.snapshot.inputValue}
                />
              </label>
              {entry.snapshot.value !== entry.snapshot.baseline ? (
                <button
                  data-hawk-eye-control={`${entry.id}-reset`}
                  data-hawk-eye-ui="per-side-reset"
                  onClick={() => {
                    setLinked(false);
                    onReset?.(entry.id);
                  }}
                  type="button"
                >
                  Reset
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
