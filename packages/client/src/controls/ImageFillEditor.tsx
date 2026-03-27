import { useMemo } from 'react';
import type { PropertySnapshot } from '../types';

interface ImageFillConfig {
  url: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
}

interface ImageFillEditorProps {
  snapshot: PropertySnapshot;
  onChange(value: string): void;
}

const BACKGROUND_SIZE_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill', value: '100% 100%' },
];

const BACKGROUND_POSITION_OPTIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Top Left', value: 'top left' },
  { label: 'Top Right', value: 'top right' },
  { label: 'Bottom Left', value: 'bottom left' },
  { label: 'Bottom Right', value: 'bottom right' },
];

const BACKGROUND_REPEAT_OPTIONS = [
  { label: 'No Repeat', value: 'no-repeat' },
  { label: 'Repeat', value: 'repeat' },
  { label: 'Repeat X', value: 'repeat-x' },
  { label: 'Repeat Y', value: 'repeat-y' },
];

function parseImageFillConfig(cssString: string): ImageFillConfig {
  const urlMatch = cssString.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/);
  const url = urlMatch ? urlMatch[1] : '';
  const sizeMatch = cssString.match(/\/\s*(cover|contain|100%\s+100%)/i);
  const positionMatch = cssString.match(/\)\s*(center|top left|top right|bottom left|bottom right)/i);
  const repeatMatch = cssString.match(/\b(no-repeat|repeat-x|repeat-y|repeat)\b/i);

  return {
    url,
    backgroundSize: sizeMatch?.[1] ?? 'cover',
    backgroundPosition: positionMatch?.[1] ?? 'center',
    backgroundRepeat: repeatMatch?.[1] ?? 'no-repeat',
  };
}

function composeImageFillCss(config: ImageFillConfig): string {
  if (!config.url.trim()) return 'none';
  return `url('${config.url.trim()}') ${config.backgroundPosition} / ${config.backgroundSize} ${config.backgroundRepeat}`;
}

function collectImageAssetSuggestions() {
  if (typeof document === 'undefined') {
    return [];
  }

  const suggestions = new Set<string>();

  for (const image of Array.from(document.images)) {
    const src = image.getAttribute('src')?.trim();
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      suggestions.add(src);
    }
  }

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
    const backgroundImage = window.getComputedStyle(node).backgroundImage;
    const match = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    const src = match?.[1]?.trim();
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      suggestions.add(src);
    }
  }

  return Array.from(suggestions).sort();
}

export function ImageFillEditor({ snapshot, onChange }: ImageFillEditorProps) {
  const config = parseImageFillConfig(snapshot.inputValue || snapshot.baseline || '');
  const suggestions = useMemo(() => collectImageAssetSuggestions(), []);

  function updateField(field: keyof ImageFillConfig, value: string) {
    onChange(
      composeImageFillCss({
        ...config,
        [field]: value,
      })
    );
  }

  return (
    <div data-hawk-eye-ui="image-fill-editor">
      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Asset Path</label>
        <input
          aria-label="Image asset path"
          data-hawk-eye-control="imageFill-url"
          data-hawk-eye-ui="text-input"
          list="hawk-eye-image-asset-options"
          onChange={(event) => updateField('url', event.currentTarget.value)}
          placeholder="./assets/image.png"
          type="text"
          value={config.url}
        />
        <datalist id="hawk-eye-image-asset-options">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>

      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Size</label>
        <select
          aria-label="Background size"
          data-hawk-eye-control="imageFill-size"
          data-hawk-eye-ui="select-input"
          onChange={(event) => updateField('backgroundSize', event.currentTarget.value)}
          value={config.backgroundSize}
        >
          {BACKGROUND_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Position</label>
        <select
          aria-label="Background position"
          data-hawk-eye-control="imageFill-position"
          data-hawk-eye-ui="select-input"
          onChange={(event) => updateField('backgroundPosition', event.currentTarget.value)}
          value={config.backgroundPosition}
        >
          {BACKGROUND_POSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Repeat</label>
        <select
          aria-label="Background repeat"
          data-hawk-eye-control="imageFill-repeat"
          data-hawk-eye-ui="select-input"
          onChange={(event) => updateField('backgroundRepeat', event.currentTarget.value)}
          value={config.backgroundRepeat}
        >
          {BACKGROUND_REPEAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
