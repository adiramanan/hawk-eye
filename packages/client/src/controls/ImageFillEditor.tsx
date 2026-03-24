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
  { label: 'Fill (100% 100%)', value: '100% 100%' },
  { label: 'Custom', value: 'custom' },
];

const BACKGROUND_POSITION_OPTIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Top Left', value: 'top left' },
  { label: 'Top Center', value: 'top center' },
  { label: 'Top Right', value: 'top right' },
  { label: 'Center Left', value: 'center left' },
  { label: 'Center Right', value: 'center right' },
  { label: 'Bottom Left', value: 'bottom left' },
  { label: 'Bottom Center', value: 'bottom center' },
  { label: 'Bottom Right', value: 'bottom right' },
  { label: 'Custom', value: 'custom' },
];

const BACKGROUND_REPEAT_OPTIONS = [
  { label: 'No Repeat', value: 'no-repeat' },
  { label: 'Repeat', value: 'repeat' },
  { label: 'Repeat X', value: 'repeat-x' },
  { label: 'Repeat Y', value: 'repeat-y' },
];

function parseImageFillConfig(cssString: string): ImageFillConfig {
  // Very basic parser: look for url() and extract background-size/position/repeat
  const urlMatch = cssString.match(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/);
  const url = urlMatch ? urlMatch[1] : '';

  // These are simplified — in reality, would need more robust parsing
  // For MVP, we'll just store the URL and use reasonable defaults
  const backgroundSize = 'cover';
  const backgroundPosition = 'center';
  const backgroundRepeat = 'no-repeat';

  return { url, backgroundSize, backgroundPosition, backgroundRepeat };
}

function composeImageFillCss(config: ImageFillConfig): string {
  if (!config.url) return 'none';

  const parts = [
    `url('${config.url}')`,
    `${config.backgroundSize}`,
    `${config.backgroundPosition}`,
    `${config.backgroundRepeat}`,
  ];

  return parts.join(' / ');
}

export function ImageFillEditor({ snapshot, onChange }: ImageFillEditorProps) {
  const config = parseImageFillConfig(snapshot.inputValue || snapshot.baseline || '');

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
      {/* URL Input */}
      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Image URL</label>
        <input
          aria-label="Image URL"
          data-hawk-eye-control="imageFill-url"
          data-hawk-eye-ui="text-input"
          onChange={(event) => updateField('url', event.currentTarget.value)}
          placeholder="https://example.com/image.jpg"
          type="text"
          value={config.url}
        />
      </div>

      {/* Background Size Select */}
      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Size</label>
        <select
          aria-label="Background size"
          data-hawk-eye-control="imageFill-size"
          data-hawk-eye-ui="select-input"
          onChange={(event) => updateField('backgroundSize', event.currentTarget.value)}
          value={
            BACKGROUND_SIZE_OPTIONS.some((opt) => opt.value === config.backgroundSize)
              ? config.backgroundSize
              : 'custom'
          }
        >
          {BACKGROUND_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Background Position Select */}
      <div data-hawk-eye-ui="image-fill-field">
        <label data-hawk-eye-ui="field-label">Position</label>
        <select
          aria-label="Background position"
          data-hawk-eye-control="imageFill-position"
          data-hawk-eye-ui="select-input"
          onChange={(event) => updateField('backgroundPosition', event.currentTarget.value)}
          value={
            BACKGROUND_POSITION_OPTIONS.some((opt) => opt.value === config.backgroundPosition)
              ? config.backgroundPosition
              : 'custom'
          }
        >
          {BACKGROUND_POSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Background Repeat Select */}
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
