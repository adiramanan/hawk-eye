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

export interface OklchColor {
  l: number;
  c: number;
  h: number;
  a: number;
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

function oklchToRgba(color: OklchColor): RgbaColor {
  const hueRadians = (color.h * Math.PI) / 180;
  const okA = color.c * Math.cos(hueRadians);
  const okB = color.c * Math.sin(hueRadians);

  const l = color.l + 0.3963377774 * okA + 0.2158037573 * okB;
  const m = color.l - 0.1055613458 * okA - 0.0638541728 * okB;
  const s = color.l - 0.0894841775 * okA - 1.291485548 * okB;

  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;

  const linearR = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const linearG = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const linearB = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const linearToSrgb = (channel: number) => {
    const clamped = clamp(channel, 0, 1);
    if (clamped <= 0.0031308) {
      return clamped * 12.92;
    }
    return 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(clamp(linearToSrgb(linearR), 0, 1) * 255),
    g: Math.round(clamp(linearToSrgb(linearG), 0, 1) * 255),
    b: Math.round(clamp(linearToSrgb(linearB), 0, 1) * 255),
    a: color.a,
  };
}

function parseOklch(value: string): RgbaColor | null {
  const match = value.match(
    /oklch\(\s*([+-]?\d+(?:\.\d+)?%?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)(?:deg)?(?:\s*\/\s*([+-]?\d+(?:\.\d+)?%?))?\s*\)/
  );

  if (!match) {
    return null;
  }

  const lightnessToken = match[1];
  const alphaToken = match[4];
  const lightness = lightnessToken.endsWith('%')
    ? clamp(parseFloat(lightnessToken) / 100, 0, 1)
    : clamp(parseFloat(lightnessToken), 0, 1);
  const chroma = Math.max(0, parseFloat(match[2]));
  const hue = ((parseFloat(match[3]) % 360) + 360) % 360;
  const alpha = alphaToken
    ? alphaToken.endsWith('%')
      ? clamp(parseFloat(alphaToken) / 100, 0, 1)
      : clamp(parseFloat(alphaToken), 0, 1)
    : 1;

  if (
    [lightness, chroma, hue, alpha].some((component) => Number.isNaN(component))
  ) {
    return null;
  }

  return oklchToRgba({
    l: lightness,
    c: chroma,
    h: hue,
    a: alpha,
  });
}

function parseWithBrowser(cssValue: string): RgbaColor | null {
  if (typeof document === 'undefined' || !document.body || typeof window === 'undefined') {
    return null;
  }

  const probe = document.createElement('div');
  probe.style.color = '';
  probe.style.color = cssValue;

  if (!probe.style.color) {
    return null;
  }

  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return parseRgb(resolved);
}

export function parseColor(cssValue: string): RgbaColor | null {
  const trimmed = cssValue.trim().toLowerCase();
  const normalizedHex = /^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/.test(trimmed)
    ? `#${trimmed}`
    : trimmed;

  if (normalizedHex in NAMED_COLORS) {
    return parseHex(NAMED_COLORS[normalizedHex]);
  }

  if (normalizedHex.startsWith('#')) {
    return parseHex(normalizedHex);
  }

  if (normalizedHex.startsWith('rgb')) {
    return parseRgb(normalizedHex);
  }

  if (normalizedHex.startsWith('hsl')) {
    return parseHsl(normalizedHex);
  }

  if (normalizedHex.startsWith('oklch')) {
    return parseOklch(normalizedHex);
  }

  return parseWithBrowser(normalizedHex);
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

export function rgbaToRgbString(color: RgbaColor): string {
  if (color.a < 1) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${Number(color.a.toFixed(2))})`;
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

function srgbToLinear(channel: number) {
  const normalized = channel / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function rgbaToOklch(color: RgbaColor): OklchColor {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const okL = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const okA = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const okB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  const c = Math.sqrt(okA * okA + okB * okB);
  let h = Math.atan2(okB, okA) * (180 / Math.PI);
  if (h < 0) {
    h += 360;
  }

  return {
    l: Number(okL.toFixed(4)),
    c: Number(c.toFixed(4)),
    h: Number(h.toFixed(2)),
    a: color.a,
  };
}

export function rgbaToOklchString(color: RgbaColor): string {
  const oklch = rgbaToOklch(color);
  if (oklch.a < 1) {
    return `oklch(${oklch.l} ${oklch.c} ${oklch.h} / ${Number(oklch.a.toFixed(2))})`;
  }
  return `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;
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
