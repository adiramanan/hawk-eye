import { useEffect, useMemo, useState } from 'react';
import type { PropertySnapshot } from '../types';
import {
  cloneGridTrack,
  createDefaultGridTrack,
  formatGridTrackNumber,
  getGridTrackUnit,
  parseGridTracks,
  serializeGridTracks,
  type GridTrackAxis,
  type GridTrackDefinition,
  type GridTrackMode,
} from '../utils/grid-tracks';

interface GridTrackEditorProps {
  axis: GridTrackAxis;
  label: string;
  propertyId: 'gridColumns' | 'gridRows';
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

const GRID_TRACK_MODE_OPTIONS: Array<{ label: string; value: GridTrackMode }> = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Fill', value: 'fill' },
  { label: 'Hug', value: 'hug' },
];

function isCompleteNumericInput(rawValue: string) {
  return /^-?(?:\d+|\d*\.\d+)$/.test(rawValue.trim());
}

function tracksToInputValues(tracks: GridTrackDefinition[]) {
  return tracks.map((track) => formatGridTrackNumber(track.value));
}

function getSourceValue(snapshot: PropertySnapshot) {
  return snapshot.inputValue || snapshot.value || snapshot.baseline;
}

function normalizeTrackForMode(track: GridTrackDefinition, mode: GridTrackMode) {
  const fallbackTrack =
    mode === 'fill' ? createDefaultGridTrack('columns') : createDefaultGridTrack('rows');
  const nextValue = Number.isFinite(track.value) ? track.value : fallbackTrack.value;

  return {
    mode,
    unit: getGridTrackUnit(mode),
    value: nextValue >= 0 ? nextValue : 0,
  };
}

export function GridTrackEditor({
  axis,
  label,
  propertyId,
  snapshot,
  onChange,
}: GridTrackEditorProps) {
  const sourceValue = getSourceValue(snapshot);
  const parsed = useMemo(() => parseGridTracks(sourceValue, axis), [axis, sourceValue]);
  const [draftValues, setDraftValues] = useState(() => tracksToInputValues(parsed.tracks));
  const dirty = snapshot.value !== snapshot.baseline;

  useEffect(() => {
    setDraftValues(tracksToInputValues(parsed.tracks));
  }, [sourceValue, parsed.tracks]);

  function commitTracks(nextTracks: GridTrackDefinition[]) {
    onChange(serializeGridTracks(nextTracks));
  }

  function updateDraftValues(nextTracks: GridTrackDefinition[]) {
    setDraftValues(tracksToInputValues(nextTracks));
  }

  function handleAddTrack() {
    const fallbackTrack = createDefaultGridTrack(axis);
    const lastTrack = parsed.tracks[parsed.tracks.length - 1] ?? fallbackTrack;
    const nextTracks = [...parsed.tracks, cloneGridTrack(lastTrack)];
    updateDraftValues(nextTracks);
    commitTracks(nextTracks);
  }

  function handleRemoveTrack(index: number) {
    if (parsed.tracks.length <= 1) {
      return;
    }

    const nextTracks = parsed.tracks.filter((_, trackIndex) => trackIndex !== index);
    updateDraftValues(nextTracks);
    commitTracks(nextTracks);
  }

  function handleModeChange(index: number, mode: GridTrackMode) {
    const nextTracks = parsed.tracks.map((track, trackIndex) =>
      trackIndex === index ? normalizeTrackForMode(track, mode) : track
    );

    updateDraftValues(nextTracks);
    commitTracks(nextTracks);
  }

  function handleValueChange(index: number, rawValue: string) {
    setDraftValues((current) => {
      const next = [...current];
      next[index] = rawValue;
      return next;
    });

    if (!isCompleteNumericInput(rawValue)) {
      return;
    }

    const nextValue = Number.parseFloat(rawValue.trim());
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      return;
    }

    const nextTracks = parsed.tracks.map((track, trackIndex) =>
      trackIndex === index ? { ...track, value: nextValue } : track
    );
    commitTracks(nextTracks);
  }

  function handleValueBlur(index: number) {
    setDraftValues((current) => {
      const next = [...current];
      next[index] = formatGridTrackNumber(parsed.tracks[index]?.value ?? 0);
      return next;
    });
  }

  return (
    <div
      data-axis={axis}
      data-dirty={dirty ? 'true' : 'false'}
      data-hawk-eye-ui="grid-track-editor"
      data-invalid={snapshot.invalid ? 'true' : 'false'}
      data-property-id={propertyId}
    >
      <div data-hawk-eye-ui="grid-track-header">
        <span data-hawk-eye-ui="grid-track-title">{label}</span>
        <button
          aria-label={`Add ${label.toLowerCase().slice(0, -1)}`}
          data-hawk-eye-control={`${propertyId}-add`}
          data-hawk-eye-ui="grid-track-icon-button"
          onClick={handleAddTrack}
          type="button"
        >
          +
        </button>
      </div>

      <div data-hawk-eye-ui="grid-track-list">
        {parsed.tracks.map((track, index) => (
          <div data-hawk-eye-ui="grid-track-row" key={`${propertyId}-${index}`}>
            <span data-hawk-eye-ui="grid-track-index">{index + 1}</span>
            <select
              aria-label={`${label} ${index + 1} mode`}
              data-hawk-eye-control={`${propertyId}-mode-${index}`}
              data-hawk-eye-ui="select-input"
              onChange={(event) => handleModeChange(index, event.currentTarget.value as GridTrackMode)}
              value={track.mode}
            >
              {GRID_TRACK_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div data-hawk-eye-ui="grid-track-value-shell">
              <input
                aria-label={`${label} ${index + 1} value`}
                data-hawk-eye-control={`${propertyId}-value-${index}`}
                data-hawk-eye-ui="grid-track-value-input"
                inputMode="decimal"
                onBlur={() => handleValueBlur(index)}
                onChange={(event) => handleValueChange(index, event.currentTarget.value)}
                onFocus={(event) => event.currentTarget.select()}
                type="text"
                value={draftValues[index] ?? formatGridTrackNumber(track.value)}
              />
              <span data-hawk-eye-ui="grid-track-unit">{track.unit}</span>
            </div>

            <button
              aria-label={`Remove ${label.toLowerCase().slice(0, -1)} ${index + 1}`}
              data-hawk-eye-control={`${propertyId}-remove-${index}`}
              data-hawk-eye-ui="grid-track-icon-button"
              disabled={parsed.tracks.length <= 1}
              onClick={() => handleRemoveTrack(index)}
              type="button"
            >
              -
            </button>
          </div>
        ))}
      </div>

      {parsed.lossy ? (
        <p data-hawk-eye-ui="grid-track-helper">
          Custom track CSS was normalized to editable Fill, Fixed, and Hug values.
        </p>
      ) : null}
    </div>
  );
}
