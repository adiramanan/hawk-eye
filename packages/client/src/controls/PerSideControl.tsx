import { useState } from 'react';
import type { EditablePropertyId, PropertySnapshot } from '../types';

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
  if (entries.length === 0) {
    return true;
  }

  return entries.every((entry) => entry.snapshot.value === entries[0].snapshot.value);
}

export function PerSideControl({ label, sides, onChange, onReset }: PerSideProps) {
  const entries = [
    { key: 'top' as const, label: 'T', ...sides.top },
    { key: 'right' as const, label: 'R', ...sides.right },
    { key: 'bottom' as const, label: 'B', ...sides.bottom },
    { key: 'left' as const, label: 'L', ...sides.left },
  ];
  const [linked, setLinked] = useState(() =>
    areLinked(entries.map((entry) => ({ id: entry.id, snapshot: entry.snapshot })))
  );

  function handleChange(propertyId: EditablePropertyId, value: string) {
    if (linked) {
      onChange(sides.top.id, value);
      onChange(sides.right.id, value);
      onChange(sides.bottom.id, value);
      onChange(sides.left.id, value);
    } else {
      onChange(propertyId, value);
    }
  }

  return (
    <div data-hawk-eye-ui="per-side-control">
      <div data-hawk-eye-ui="per-side-header">
        <span data-hawk-eye-ui="per-side-label">{label}</span>
        <button
          aria-label={linked ? 'Edit sides independently' : 'Link sides together'}
          data-active={linked ? 'true' : 'false'}
          data-hawk-eye-ui="per-side-link"
          onClick={() => setLinked(!linked)}
          type="button"
        >
          {linked ? 'All' : 'Each'}
        </button>
      </div>
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
                onChange={(event) => handleChange(entry.id, event.currentTarget.value)}
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
    </div>
  );
}
