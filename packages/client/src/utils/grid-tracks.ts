import { parseCssValue } from './css-value';

export type GridTrackAxis = 'columns' | 'rows';
export type GridTrackMode = 'fixed' | 'fill' | 'hug';
export type GridTrackUnit = 'fr' | 'px';

export interface GridTrackDefinition {
  mode: GridTrackMode;
  unit: GridTrackUnit;
  value: number;
}

export interface ParsedGridTracks {
  lossy: boolean;
  tracks: GridTrackDefinition[];
}

interface ExpandedTrackTokens {
  lossy: boolean;
  tokens: string[];
}

interface ParsedGridTrackToken {
  lossy: boolean;
  track: GridTrackDefinition;
}

const LENGTH_MATCHER =
  /(-?\d+(?:\.\d+)?)\s*(px|rem|em|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc)\b/gi;
const FR_MATCHER = /(-?\d+(?:\.\d+)?)\s*fr\b/gi;
const FIT_CONTENT_MATCHER = /fit-content\(\s*(-?\d+(?:\.\d+)?)\s*([a-z%]*)\s*\)/gi;

export function createDefaultGridTrack(axis: GridTrackAxis): GridTrackDefinition {
  if (axis === 'columns') {
    return { mode: 'fill', unit: 'fr', value: 1 };
  }

  return { mode: 'hug', unit: 'px', value: 72 };
}

export function cloneGridTrack(track: GridTrackDefinition): GridTrackDefinition {
  return { ...track };
}

export function getGridTrackUnit(mode: GridTrackMode): GridTrackUnit {
  return mode === 'fill' ? 'fr' : 'px';
}

export function formatGridTrackNumber(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Number.isInteger(value)) {
    return String(Math.trunc(value));
  }

  return value.toFixed(3).replace(/\.?0+$/, '');
}

export function serializeGridTrack(track: GridTrackDefinition) {
  const normalized = normalizeGridTrack(track);
  const formattedValue = formatGridTrackNumber(normalized.value);

  if (normalized.mode === 'fill') {
    return `${formattedValue}fr`;
  }

  if (normalized.mode === 'hug') {
    return `fit-content(${formattedValue}px)`;
  }

  return `${formattedValue}px`;
}

export function serializeGridTracks(tracks: GridTrackDefinition[]) {
  const normalizedTracks = tracks.length > 0 ? tracks : [createDefaultGridTrack('columns')];
  return normalizedTracks.map(serializeGridTrack).join(' ');
}

export function parseGridTracks(rawValue: string, axis: GridTrackAxis): ParsedGridTracks {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return { lossy: false, tracks: [createDefaultGridTrack(axis)] };
  }

  const expanded = expandTrackTokens(trimmed);
  const sourceTokens = expanded.tokens.length > 0 ? expanded.tokens : [trimmed];
  let lossy = expanded.lossy;

  const tracks = sourceTokens.map((token) => {
    const parsed = parseTrackToken(token, axis);
    lossy ||= parsed.lossy;
    return parsed.track;
  });

  return {
    lossy,
    tracks: tracks.length > 0 ? tracks : [createDefaultGridTrack(axis)],
  };
}

function normalizeGridTrack(track: GridTrackDefinition): GridTrackDefinition {
  const mode = track.mode;
  const fallbackTrack = mode === 'fill' ? createDefaultGridTrack('columns') : createDefaultGridTrack('rows');
  const value = Number.isFinite(track.value) ? track.value : fallbackTrack.value;

  return {
    mode,
    unit: getGridTrackUnit(mode),
    value: value >= 0 ? value : 0,
  };
}

function splitTopLevelTrackTokens(value: string) {
  const tokens: string[] = [];
  let bracketDepth = 0;
  let parenDepth = 0;
  let current = '';

  for (const char of value) {
    if ((char === ' ' || char === ',') && parenDepth === 0 && bracketDepth === 0) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
    }

    current += char;
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

function expandTrackTokens(value: string): ExpandedTrackTokens {
  const tokens = splitTopLevelTrackTokens(value);

  if (tokens.length === 0) {
    return { lossy: false, tokens: [] };
  }

  const expandedTokens: string[] = [];
  let lossy = false;

  for (const token of tokens) {
    const repeated = parseRepeatToken(token);

    if (!repeated) {
      expandedTokens.push(token);
      continue;
    }

    const innerExpanded = expandTrackTokens(repeated.content);
    if (innerExpanded.tokens.length === 0) {
      lossy = true;
      continue;
    }

    lossy ||= innerExpanded.lossy;

    for (let count = 0; count < repeated.count; count += 1) {
      expandedTokens.push(...innerExpanded.tokens);
    }
  }

  return {
    lossy,
    tokens: expandedTokens,
  };
}

function parseRepeatToken(token: string) {
  const match = token.match(/^repeat\(\s*(\d+)\s*,\s*(.*)\s*\)$/i);

  if (!match) {
    return null;
  }

  const count = Number.parseInt(match[1] ?? '', 10);
  const content = match[2]?.trim() ?? '';

  if (!Number.isInteger(count) || count < 1 || !content) {
    return null;
  }

  return { content, count };
}

function parseTrackToken(token: string, axis: GridTrackAxis): ParsedGridTrackToken {
  const trimmed = token.trim();

  if (!trimmed) {
    return { lossy: true, track: createDefaultGridTrack(axis) };
  }

  const exactFitContent = trimmed.match(/^fit-content\(\s*(.*?)\s*\)$/i);
  if (exactFitContent) {
    const parsedLength = parseLengthValue(exactFitContent[1] ?? '');

    if (parsedLength) {
      return {
        lossy: parsedLength.lossy,
        track: {
          mode: 'hug',
          unit: 'px',
          value: parsedLength.value,
        },
      };
    }
  }

  const exactFill = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*fr$/i);
  if (exactFill?.[1]) {
    return {
      lossy: false,
      track: {
        mode: 'fill',
        unit: 'fr',
        value: Number.parseFloat(exactFill[1]),
      },
    };
  }

  const exactLength = parseLengthValue(trimmed);
  if (exactLength) {
    return {
      lossy: exactLength.lossy,
      track: {
        mode: 'fixed',
        unit: 'px',
        value: exactLength.value,
      },
    };
  }

  const fallbackFitContent = getLastFitContentLength(trimmed);
  if (fallbackFitContent) {
    return {
      lossy: true,
      track: {
        mode: 'hug',
        unit: 'px',
        value: fallbackFitContent.value,
      },
    };
  }

  const fallbackFr = getLastFrValue(trimmed);
  if (fallbackFr !== null) {
    return {
      lossy: true,
      track: {
        mode: 'fill',
        unit: 'fr',
        value: fallbackFr,
      },
    };
  }

  const fallbackLength = getLastLengthValue(trimmed);
  if (fallbackLength) {
    return {
      lossy: true,
      track: {
        mode: 'fixed',
        unit: 'px',
        value: fallbackLength.value,
      },
    };
  }

  return { lossy: true, track: createDefaultGridTrack(axis) };
}

function parseLengthValue(rawValue: string) {
  const parsed = parseCssValue(rawValue.trim());

  if (!parsed) {
    return null;
  }

  return {
    lossy: Boolean(parsed.unit && parsed.unit !== 'px'),
    value: parsed.number,
  };
}

function getLastFrValue(rawValue: string) {
  const matches = Array.from(rawValue.matchAll(FR_MATCHER));
  const lastMatch = matches[matches.length - 1];

  if (!lastMatch?.[1]) {
    return null;
  }

  return Number.parseFloat(lastMatch[1]);
}

function getLastLengthValue(rawValue: string) {
  const matches = Array.from(rawValue.matchAll(LENGTH_MATCHER));
  const lastMatch = matches[matches.length - 1];

  if (!lastMatch?.[1]) {
    return null;
  }

  return {
    value: Number.parseFloat(lastMatch[1]),
  };
}

function getLastFitContentLength(rawValue: string) {
  const matches = Array.from(rawValue.matchAll(FIT_CONTENT_MATCHER));
  const lastMatch = matches[matches.length - 1];

  if (!lastMatch?.[1]) {
    return null;
  }

  return {
    value: Number.parseFloat(lastMatch[1]),
  };
}
