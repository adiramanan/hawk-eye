# Color Picker Component

## Metadata
- Name: Color Picker
- Category: Input Control
- Status: Production
- Last Updated: 2026-03-24

## Overview

The Color Picker allows users to select colors through various input methods: hex input, RGB sliders, or visual picker. It's used in the Properties Panel for fill and stroke editing.

**When to use:**
- For color selection in design tools
- As part of fill/stroke controls
- In any interface requiring precise color input

**When not to use:**
- For simple boolean toggles
- For non-color selections

## Anatomy

```
┌──────────────────────────┐
│ Color Preview [#0D87F7]  │
├──────────────────────────┤
│ H: [0  ----●----  360]   │
│ S: [0  ----●----  100]   │
│ V: [0  ----●----  100]   │
├──────────────────────────┤
│ Hex: │0D87F7      │      │
└──────────────────────────┘
```

## Tokens Used

### Container
- `--color-bg-secondary` — Picker background
- `--color-border` — Picker border
- `--radius-md` — Picker border radius
- `--shadow-md` — Picker elevation (when floating)

### Preview Swatch
- `--spacing-md` — Preview padding (12px)
- `--radius-sm` — Swatch border radius
- User's selected color value

### Sliders
- `--spacing-md` — Slider height (12px)
- `--spacing-lg` — Slider width (16px)
- `--color-input-bg` — Track background
- `--color-accent` — Thumb/handle color
- `--spacing-base` — Spacing between sliders (8px)

### Text Input
- `--font-size-xs` — Input text (11px)
- `--font-family-base` — Monospace for hex
- `--color-input-bg` — Input background
- `--color-input-border` — Input border
- `--color-input-focus` — Focus ring color
- `--radius-sm` — Input border radius
- `--spacing-sm` — Input padding

## Props/API

```tsx
interface ColorPickerProps {
  value: string;           // Hex color, e.g., "#0D87F7"
  onChange: (color: string) => void;
  onClose?: () => void;
  position?: 'fixed' | 'absolute';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
```

## States

### Default State
- Closed or inline picker
- Shows current color swatch
- All inputs interactive

### Open State
- Floating picker appears
- Positioned relative to trigger element
- Click outside closes picker
- Elevation: `--shadow-lg` or `--shadow-xl`

### Focus State
- Focused input shows `--color-input-focus` ring
- Slider thumb highlights with `--color-accent`

### Hover State
- Slider thumb grows or highlights (`--color-accent-hover`)
- Swatch shows subtle elevation (`--shadow-sm`)

### Disabled State
- All inputs disabled
- Text uses `--color-text-disabled`
- Background uses `--color-bg-tertiary`

## Code Example

```tsx
export function ColorPicker({ value, onChange, onClose }: ColorPickerProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: `1px solid var(--color-border)`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Color Preview */}
      <div
        style={{
          backgroundColor: value,
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--spacing-lg)',
          border: `1px solid var(--color-border)`,
        }}
      />

      {/* Hex Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'monospace',
          backgroundColor: 'var(--color-input-bg)',
          border: `1px solid var(--color-input-border)`,
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-md)',
        }}
        placeholder="Hex color"
      />

      {/* Sliders would follow similar pattern */}
    </div>
  );
}
```

## Accessibility

- **Keyboard navigation:** Tab through inputs, arrow keys for sliders
- **ARIA labels:** Use `aria-label` on sliders and inputs
- **Color blindness:** Provide hex input as alternative to visual picker
- **Focus indicators:** Use `--color-input-focus` for visible focus rings

## Animation States

### Opening Animation
```css
animation: fadeIn var(--duration-fast) var(--easing-out);
```

### Closing Animation
```css
animation: fadeOut var(--duration-fast) var(--easing-out);
```

## Cross-references

- See [Color](../foundations/color.md) for color system details
- See [Fill Input](./fill-input.md) for usage context
- See [Token Reference](../tokens/token-reference.md) for all color tokens
