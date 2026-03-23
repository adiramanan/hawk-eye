export interface ParsedCssValue {
  number: number;
  unit: string;
}

const UNIT_PATTERN = /^(-?\d+(?:\.\d+)?)\s*(px|rem|em|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc)?$/;

export function parseCssValue(raw: string): ParsedCssValue | null {
  const trimmed = raw.trim();

  if (trimmed === '0') {
    return { number: 0, unit: '' };
  }

  const match = trimmed.match(UNIT_PATTERN);

  if (!match) return null;

  return {
    number: parseFloat(match[1]),
    unit: match[2] || '',
  };
}

export function formatCssValue(value: number, unit: string): string {
  if (value === 0 && !unit) return '0';
  return `${value}${unit}`;
}

export function extractUnit(raw: string): string {
  const parsed = parseCssValue(raw);
  return parsed?.unit || 'px';
}

export function extractNumber(raw: string): number | null {
  const parsed = parseCssValue(raw);
  return parsed ? parsed.number : null;
}
