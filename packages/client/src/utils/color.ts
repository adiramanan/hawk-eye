export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HslaColor {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface HsvColor {
  h: number; // 0–360
  s: number; // 0–1
  v: number; // 0–1
  a: number; // 0–1
}

const NAMED_COLORS: Record<string, string> = {
  transparent: 'rgba(0, 0, 0, 0)',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  orange: '#ffa500',
  gray: '#808080',
  grey: '#808080',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseHex(hex: string): RgbaColor | null {
  const clean = hex.replace('#', '');
  let r: number, g: number, b: number, a = 1;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 4) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
    a = parseInt(clean[3] + clean[3], 16) / 255;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else if (clean.length === 8) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
    a = parseInt(clean.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) || Number.isNaN(a)) {
    return null;
  }

  return { r, g, b, a };
}

function parseRgb(value: string): RgbaColor | null {
  const match = value.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)/
  );

  if (!match) return null;

  return {
    r: clamp(Math.round(parseFloat(match[1])), 0, 255),
    g: clamp(Math.round(parseFloat(match[2])), 0, 255),
    b: clamp(Math.round(parseFloat(match[3])), 0, 255),
    a: match[4] != null ? clamp(parseFloat(match[4]), 0, 1) : 1,
  };
}

function parseHsl(value: string): RgbaColor | null {
  const match = value.match(
    /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)/
  );

  if (!match) return null;

  const hsla: HslaColor = {
    h: parseFloat(match[1]) % 360,
    s: clamp(parseFloat(match[2]), 0, 100) / 100,
    l: clamp(parseFloat(match[3]), 0, 100) / 100,
    a: match[4] != null ? clamp(parseFloat(match[4]), 0, 1) : 1,
  };

  return hslaToRgba(hsla);
}

export function parseColor(cssValue: string): RgbaColor | null {
  const trimmed = cssValue.trim().toLowerCase();

  if (trimmed in NAMED_COLORS) {
    return parseHex(NAMED_COLORS[trimmed]);
  }

  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  if (trimmed.startsWith('rgb')) {
    return parseRgb(trimmed);
  }

  if (trimmed.startsWith('hsl')) {
    return parseHsl(trimmed);
  }

  return null;
}

export function rgbaToHex(color: RgbaColor): string {
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');

  if (color.a < 1) {
    const a = Math.round(color.a * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }

  return `#${r}${g}${b}`;
}

export function rgbaToString(color: RgbaColor): string {
  if (color.a < 1) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function rgbaToHsla(color: RgbaColor): HslaColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: color.a,
  };
}

export function rgbaToHsv(color: RgbaColor): HsvColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s, v, a: color.a };
}

export function hsvToRgba(color: HsvColor): RgbaColor {
  const h = color.h / 360;
  const s = color.s;
  const v = color.v;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0;
  let g = 0;
  let b = 0;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: color.a,
  };
}

export function hslaToRgba(color: HslaColor): RgbaColor {
  const h = color.h / 360;
  const s = color.s;
  const l = color.l;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val, a: color.a };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a: color.a,
  };
}
