interface CssDeclaration {
  property: string;
  value: string;
}

const SPACING_SCALE = [
  '0',
  '0.5',
  '1',
  '1.5',
  '2',
  '2.5',
  '3',
  '3.5',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '14',
  '16',
  '20',
  '24',
  '28',
  '32',
  '36',
  '40',
  '44',
  '48',
  '52',
  '56',
  '60',
  '64',
  '72',
  '80',
  '96',
] as const;

const FONT_SIZE_SCALE = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',
} as const;

const FONT_WEIGHT_SCALE = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

const TEXT_ALIGN_SCALE = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
} as const;

const ROUNDED_SCALE = {
  none: '0px',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

const SHADOW_SCALE = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

const COLOR_TOKENS = {
  transparent: 'transparent',
  black: '#000000',
  white: '#ffffff',
  'gray-200': '#e5e7eb',
  'gray-600': '#4b5563',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'indigo-100': '#e0e7ff',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  'green-500': '#22c55e',
  'red-500': '#ef4444',
  'slate-50': '#f8fafc',
  'slate-200': '#e2e8f0',
  'slate-400': '#94a3b8',
  'slate-600': '#475569',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
} as const;

const SPACING_PREFIX_TO_PROPERTY = {
  pt: 'padding-top',
  pr: 'padding-right',
  pb: 'padding-bottom',
  pl: 'padding-left',
  mt: 'margin-top',
  mr: 'margin-right',
  mb: 'margin-bottom',
  ml: 'margin-left',
} as const;

const SPACING_PROPERTY_TO_PREFIX = Object.fromEntries(
  Object.entries(SPACING_PREFIX_TO_PROPERTY).map(([prefix, property]) => [property, prefix])
) as Record<string, keyof typeof SPACING_PREFIX_TO_PROPERTY>;
const TAILWIND_ROUND_TRIP_PROPERTIES = new Set([
  ...Object.keys(SPACING_PROPERTY_TO_PREFIX),
  'background-color',
  'border-radius',
  'box-shadow',
  'color',
  'font-size',
  'font-weight',
  'text-align',
]);

const TEXT_ALIGN_TOKENS = new Set(Object.keys(TEXT_ALIGN_SCALE));
const FONT_SIZE_TOKENS = new Set(Object.keys(FONT_SIZE_SCALE));

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function decodeArbitraryValue(value: string) {
  return value.replace(/_/g, ' ');
}

function encodeArbitraryValue(value: string) {
  return value.trim().replace(/\s+/g, '_');
}

function approximatelyEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.0001;
}

function parseLength(value: string) {
  const match = /^(-?(?:\d+|\d*\.\d+))(px|rem|%)$/i.exec(value.trim());

  if (!match) {
    return null;
  }

  return {
    number: Number.parseFloat(match[1]),
    unit: match[2].toLowerCase(),
  };
}

function toPx(value: string) {
  const parsed = parseLength(value);

  if (!parsed) {
    return null;
  }

  if (parsed.unit === 'px') {
    return parsed.number;
  }

  if (parsed.unit === 'rem') {
    return parsed.number * 16;
  }

  return null;
}

function normalizeLengthValue(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === '0' || trimmed === '0px' || trimmed === '0rem') {
    return '0px';
  }

  return trimmed;
}

function getSpacingToken(value: string) {
  const pxValue = toPx(value);

  if (pxValue === null) {
    return null;
  }

  return SPACING_SCALE.find((token) => approximatelyEqual(Number.parseFloat(token) * 4, pxValue)) ?? null;
}

function getScaleToken<T extends Record<string, string>>(scale: T, value: string) {
  const normalizedValue = normalizeLengthValue(value);

  return (
    Object.entries(scale).find(([, scaleValue]) => {
      const normalizedScaleValue = normalizeLengthValue(scaleValue);

      if (normalizedScaleValue === normalizedValue) {
        return true;
      }

      const leftPx = toPx(normalizedScaleValue);
      const rightPx = toPx(normalizedValue);

      return leftPx !== null && rightPx !== null && approximatelyEqual(leftPx, rightPx);
    })?.[0] ?? null
  );
}

function normalizeAlpha(alpha: number) {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
}

function parseHexColor(value: string) {
  const clean = value.trim().toLowerCase().replace('#', '');

  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
      a: 1,
    };
  }

  if (clean.length === 4) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
      a: parseInt(clean[3] + clean[3], 16) / 255,
    };
  }

  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: 1,
    };
  }

  if (clean.length === 8) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
      a: parseInt(clean.slice(6, 8), 16) / 255,
    };
  }

  return null;
}

function parseRgbColor(value: string) {
  const match =
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)$/i.exec(
      value.trim()
    );

  if (!match) {
    return null;
  }

  return {
    r: Math.round(Number.parseFloat(match[1])),
    g: Math.round(Number.parseFloat(match[2])),
    b: Math.round(Number.parseFloat(match[3])),
    a: match[4] ? Number.parseFloat(match[4]) : 1,
  };
}

function normalizeColorValue(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'transparent') {
    return 'transparent';
  }

  const parsed = trimmed.startsWith('#') ? parseHexColor(trimmed) : parseRgbColor(trimmed);

  if (!parsed) {
    return trimmed;
  }

  const hex = `#${parsed.r.toString(16).padStart(2, '0')}${parsed.g
    .toString(16)
    .padStart(2, '0')}${parsed.b.toString(16).padStart(2, '0')}`;

  return parsed.a < 1 ? `${hex}${normalizeAlpha(parsed.a)}` : hex;
}

function getColorToken(value: string) {
  const normalizedColor = normalizeColorValue(value);

  return (
    Object.entries(COLOR_TOKENS).find(([, colorValue]) => normalizeColorValue(colorValue) === normalizedColor)?.[0] ??
    null
  );
}

function normalizeShadowValue(value: string) {
  return normalizeWhitespace(value)
    .replace(/rgba\(([^)]+)\)/gi, (_match, contents: string) => {
      const [r, g, b, a] = contents.split(',').map((part) => part.trim());

      if (a == null) {
        return `rgb(${r} ${g} ${b})`;
      }

      return `rgb(${r} ${g} ${b} / ${a})`;
    })
    .toLowerCase();
}

function getShadowToken(value: string) {
  const normalizedValue = normalizeShadowValue(value);

  return (
    Object.entries(SHADOW_SCALE).find(
      ([, shadowValue]) => normalizeShadowValue(shadowValue) === normalizedValue
    )?.[0] ?? null
  );
}

function parseSpacingClass(className: string): CssDeclaration | null {
  const match = /^(-)?(pt|pr|pb|pl|mt|mr|mb|ml)-(.+)$/.exec(className);

  if (!match) {
    return null;
  }

  const [, negativeFlag, prefix, rawToken] = match;
  const property = SPACING_PREFIX_TO_PROPERTY[prefix as keyof typeof SPACING_PREFIX_TO_PROPERTY];

  if (!property) {
    return null;
  }

  if (rawToken === 'auto' && prefix.startsWith('m')) {
    return { property, value: 'auto' };
  }

  if (rawToken.startsWith('[') && rawToken.endsWith(']')) {
    const arbitraryValue = decodeArbitraryValue(rawToken.slice(1, -1));

    return {
      property,
      value: negativeFlag ? `-${arbitraryValue}` : arbitraryValue,
    };
  }

  const spacingToken = SPACING_SCALE.find((token) => token === rawToken);

  if (!spacingToken) {
    return null;
  }

  const value = Number.parseFloat(spacingToken) * 0.25;
  const remValue = value === 0 ? '0px' : `${value}rem`;

  return {
    property,
    value: negativeFlag && remValue !== '0px' ? `-${remValue}` : remValue,
  };
}

export function cssToTailwindClass(cssProperty: string, value: string): string | null {
  const property = cssProperty.trim().toLowerCase();
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const spacingPrefix = SPACING_PROPERTY_TO_PREFIX[property];

  if (spacingPrefix) {
    if (trimmedValue === 'auto' && spacingPrefix.startsWith('m')) {
      return `${spacingPrefix}-auto`;
    }

    const negative = trimmedValue.startsWith('-');
    const absoluteValue = negative ? trimmedValue.slice(1) : trimmedValue;
    const token = getSpacingToken(absoluteValue);

    if (token) {
      return negative && token !== '0' ? `-${spacingPrefix}-${token}` : `${spacingPrefix}-${token}`;
    }

    const encodedValue = encodeArbitraryValue(absoluteValue);
    return negative ? `-${spacingPrefix}-[${encodedValue}]` : `${spacingPrefix}-[${encodedValue}]`;
  }

  if (property === 'background-color') {
    const token = getColorToken(trimmedValue);
    return token ? `bg-${token}` : `bg-[${normalizeColorValue(trimmedValue)}]`;
  }

  if (property === 'color') {
    const token = getColorToken(trimmedValue);
    return token ? `text-${token}` : `text-[${normalizeColorValue(trimmedValue)}]`;
  }

  if (property === 'font-size') {
    const token = getScaleToken(FONT_SIZE_SCALE, trimmedValue);
    return token ? `text-${token}` : `text-[${encodeArbitraryValue(trimmedValue)}]`;
  }

  if (property === 'font-weight') {
    const token =
      Object.entries(FONT_WEIGHT_SCALE).find(([, scaleValue]) => scaleValue === trimmedValue)?.[0] ??
      null;
    return token ? `font-${token}` : null;
  }

  if (property === 'text-align') {
    const token =
      Object.entries(TEXT_ALIGN_SCALE).find(([, scaleValue]) => scaleValue === trimmedValue)?.[0] ??
      null;
    return token ? `text-${token}` : null;
  }

  if (property === 'border-radius') {
    const token = getScaleToken(ROUNDED_SCALE, trimmedValue);

    if (!token) {
      return `rounded-[${encodeArbitraryValue(trimmedValue)}]`;
    }

    return token === 'DEFAULT' ? 'rounded' : `rounded-${token}`;
  }

  if (property === 'box-shadow') {
    const token = getShadowToken(trimmedValue);

    if (!token) {
      return `shadow-[${encodeArbitraryValue(trimmedValue)}]`;
    }

    return token === 'DEFAULT' ? 'shadow' : `shadow-${token}`;
  }

  return null;
}

export function isTailwindRoundTripSupported(cssProperty: string) {
  return TAILWIND_ROUND_TRIP_PROPERTIES.has(cssProperty.trim().toLowerCase());
}

export function tailwindClassToCss(className: string): CssDeclaration | null {
  const trimmedClassName = className.trim();

  if (!trimmedClassName) {
    return null;
  }

  const spacingDeclaration = parseSpacingClass(trimmedClassName);

  if (spacingDeclaration) {
    return spacingDeclaration;
  }

  if (trimmedClassName.startsWith('bg-')) {
    const token = trimmedClassName.slice(3);

    if (token.startsWith('[') && token.endsWith(']')) {
      return {
        property: 'background-color',
        value: decodeArbitraryValue(token.slice(1, -1)),
      };
    }

    if (token in COLOR_TOKENS) {
      return {
        property: 'background-color',
        value: COLOR_TOKENS[token as keyof typeof COLOR_TOKENS],
      };
    }

    return null;
  }

  if (trimmedClassName.startsWith('text-')) {
    const token = trimmedClassName.slice(5);

    if (TEXT_ALIGN_TOKENS.has(token)) {
      return {
        property: 'text-align',
        value: TEXT_ALIGN_SCALE[token as keyof typeof TEXT_ALIGN_SCALE],
      };
    }

    if (FONT_SIZE_TOKENS.has(token)) {
      return {
        property: 'font-size',
        value: FONT_SIZE_SCALE[token as keyof typeof FONT_SIZE_SCALE],
      };
    }

    if (token.startsWith('[') && token.endsWith(']')) {
      const arbitraryValue = decodeArbitraryValue(token.slice(1, -1));
      const normalizedColor = normalizeColorValue(arbitraryValue);
      const isColor =
        normalizedColor === 'transparent' ||
        normalizedColor.startsWith('#') ||
        normalizedColor.startsWith('rgb');

      return {
        property: isColor ? 'color' : 'font-size',
        value: isColor ? normalizedColor : arbitraryValue,
      };
    }

    if (token in COLOR_TOKENS) {
      return {
        property: 'color',
        value: COLOR_TOKENS[token as keyof typeof COLOR_TOKENS],
      };
    }

    return null;
  }

  if (trimmedClassName.startsWith('font-')) {
    const token = trimmedClassName.slice(5);

    if (!(token in FONT_WEIGHT_SCALE)) {
      return null;
    }

    return {
      property: 'font-weight',
      value: FONT_WEIGHT_SCALE[token as keyof typeof FONT_WEIGHT_SCALE],
    };
  }

  if (trimmedClassName === 'rounded') {
    return {
      property: 'border-radius',
      value: ROUNDED_SCALE.DEFAULT,
    };
  }

  if (trimmedClassName.startsWith('rounded-')) {
    const token = trimmedClassName.slice(8);

    if (token.startsWith('[') && token.endsWith(']')) {
      return {
        property: 'border-radius',
        value: decodeArbitraryValue(token.slice(1, -1)),
      };
    }

    if (!(token in ROUNDED_SCALE)) {
      return null;
    }

    return {
      property: 'border-radius',
      value: ROUNDED_SCALE[token as keyof typeof ROUNDED_SCALE],
    };
  }

  if (trimmedClassName === 'shadow') {
    return {
      property: 'box-shadow',
      value: SHADOW_SCALE.DEFAULT,
    };
  }

  if (trimmedClassName.startsWith('shadow-')) {
    const token = trimmedClassName.slice(7);

    if (token.startsWith('[') && token.endsWith(']')) {
      return {
        property: 'box-shadow',
        value: decodeArbitraryValue(token.slice(1, -1)),
      };
    }

    if (!(token in SHADOW_SCALE)) {
      return null;
    }

    return {
      property: 'box-shadow',
      value: SHADOW_SCALE[token as keyof typeof SHADOW_SCALE],
    };
  }

  return null;
}
