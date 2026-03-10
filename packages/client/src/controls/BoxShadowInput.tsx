import type { PropertySnapshot } from '../types';

interface ParsedBoxShadow {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  inset: boolean;
  unsupported: boolean;
}

interface BoxShadowInputProps {
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of value) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (char === separator && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function tokenize(value: string) {
  return splitTopLevel(value, ' ').filter(Boolean);
}

function looksLikeColor(token: string) {
  return (
    token.startsWith('#') ||
    token.startsWith('rgb(') ||
    token.startsWith('rgba(') ||
    token.startsWith('hsl(') ||
    token.startsWith('hsla(') ||
    /^[a-z-]+$/i.test(token)
  );
}

function parseBoxShadow(value: string): ParsedBoxShadow {
  const trimmed = value.trim();

  if (!trimmed || trimmed === 'none') {
    return {
      x: '0px',
      y: '4px',
      blur: '12px',
      spread: '0px',
      color: 'rgba(15, 23, 42, 0.18)',
      inset: false,
      unsupported: false,
    };
  }

  if (splitTopLevel(trimmed, ',').length > 1) {
    return {
      x: '0px',
      y: '4px',
      blur: '12px',
      spread: '0px',
      color: 'rgba(15, 23, 42, 0.18)',
      inset: false,
      unsupported: true,
    };
  }

  const tokens = tokenize(trimmed);
  const inset = tokens.includes('inset');
  const colorToken = tokens.find((token) => token !== 'inset' && looksLikeColor(token)) ?? '';
  const lengthTokens = tokens.filter((token) => token !== 'inset' && token !== colorToken);

  return {
    x: lengthTokens[0] ?? '0px',
    y: lengthTokens[1] ?? '4px',
    blur: lengthTokens[2] ?? '12px',
    spread: lengthTokens[3] ?? '0px',
    color: colorToken || 'rgba(15, 23, 42, 0.18)',
    inset,
    unsupported: false,
  };
}

function composeBoxShadow(parsed: ParsedBoxShadow) {
  const parts = [
    parsed.inset ? 'inset' : '',
    parsed.x || '0px',
    parsed.y || '0px',
    parsed.blur || '0px',
    parsed.spread || '0px',
    parsed.color || 'rgba(15, 23, 42, 0.18)',
  ].filter(Boolean);

  return parts.join(' ');
}

export function BoxShadowInput({ snapshot, onChange }: BoxShadowInputProps) {
  const parsed = parseBoxShadow(snapshot.inputValue || snapshot.baseline);

  function updateField(field: keyof ParsedBoxShadow, value: string | boolean) {
    onChange(
      composeBoxShadow({
        ...parsed,
        [field]: value,
      })
    );
  }

  return (
    <div data-hawk-eye-ui="shadow-editor">
      <div data-hawk-eye-ui="shadow-grid">
        {[
          { key: 'x', label: 'X', value: parsed.x },
          { key: 'y', label: 'Y', value: parsed.y },
          { key: 'blur', label: 'Blur', value: parsed.blur },
          { key: 'spread', label: 'Spread', value: parsed.spread },
        ].map((field) => (
          <label data-hawk-eye-ui="shadow-field" key={field.key}>
            <span data-hawk-eye-ui="per-side-input-label">{field.label}</span>
            <input
              aria-label={`Box shadow ${field.label}`}
              data-hawk-eye-control={`boxShadow-${field.key}`}
              data-hawk-eye-ui="text-input"
              onChange={(event) =>
                updateField(field.key as keyof ParsedBoxShadow, event.currentTarget.value)
              }
              type="text"
              value={field.value}
            />
          </label>
        ))}
      </div>

      <div data-hawk-eye-ui="shadow-color-row">
        <span
          data-hawk-eye-ui="color-swatch"
          style={{ backgroundColor: parsed.color || 'transparent' }}
        />
        <input
          aria-label="Box shadow color"
          data-hawk-eye-control="boxShadow-color"
          data-hawk-eye-ui="text-input"
          onChange={(event) => updateField('color', event.currentTarget.value)}
          type="text"
          value={parsed.color}
        />
        <button
          aria-label={parsed.inset ? 'Disable inset shadow' : 'Enable inset shadow'}
          data-active={parsed.inset ? 'true' : 'false'}
          data-hawk-eye-control="boxShadow-inset"
          data-hawk-eye-ui="per-side-link"
          onClick={() => updateField('inset', !parsed.inset)}
          type="button"
        >
          Inset
        </button>
      </div>

      {parsed.unsupported ? (
        <p data-hawk-eye-ui="hint">
          Structured controls support a single shadow. Use the raw field to preserve complex values.
        </p>
      ) : null}

      <label data-hawk-eye-ui="shadow-field">
        <span data-hawk-eye-ui="per-side-input-label">Raw</span>
        <input
          aria-label="Box shadow raw value"
          data-hawk-eye-control="boxShadow-raw"
          data-hawk-eye-ui="text-input"
          onChange={(event) => onChange(event.currentTarget.value)}
          type="text"
          value={snapshot.inputValue}
        />
      </label>
    </div>
  );
}
