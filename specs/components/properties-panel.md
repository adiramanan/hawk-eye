# Properties Panel Component

## Metadata
- Name: Properties Panel
- Category: UI Container
- Status: Production
- Last Updated: 2026-03-24

## Overview

The Properties Panel is a resizable sidebar that displays and edits the selected element's properties. It's the main interface for design manipulation in hawk-eye.

**When to use:**
- As the primary editing surface for element properties
- To display hierarchical controls and options

**When not to use:**
- For read-only information display (use a tooltip instead)
- For actions that should be inline

## Anatomy

```
┌─────────────────────┐
│ Properties Panel    │
├─────────────────────┤
│ Section 1           │
│ ├─ Control 1        │
│ ├─ Control 2        │
│ └─ Control 3        │
├─────────────────────┤
│ Section 2           │
│ ├─ Control 4        │
│ └─ Control 5        │
└─────────────────────┘
```

## Tokens Used

### Layout Tokens
- `--spacing-lg` — Panel padding (16px)
- `--spacing-md` — Section spacing (12px)
- `--spacing-base` — Control spacing (8px)

### Color Tokens
- `--color-bg` — Panel background
- `--color-border` — Panel and section borders
- `--color-text-primary` — Headings and main text

### Typography Tokens
- `--font-size-sm` — Section titles (12px)
- `--font-weight-strong` — Section title weight (600)
- `--font-size-base` — Control labels (16px)
- `--font-weight-base` — Label weight (500)

### Elevation Tokens
- `--shadow-md` — Panel elevation (when floating)
- `--shadow-sm` — Section cards (if applicable)

### Border Tokens
- `--radius-md` — Panel corners (if rounded)
- `--color-border` — Section dividers

## Props/API

```tsx
interface PropertiesPanelProps {
  width?: number;        // Default: 320px
  isOpen?: boolean;      // Show/hide panel
  onClose?: () => void;  // Close handler
  selectedElement?: Element; // Current selection
}
```

## States

### Default State
- Solid background with subtle borders
- Full opacity, all controls interactive
- Scrollable if content exceeds height

### Hover State
- Section cards elevate slightly (`--shadow-sm`)
- No change to panel itself

### Focus State
- Focused inputs use `--color-input-focus`
- Interactive controls show focus ring

### Disabled State
- Disabled controls use `--color-text-disabled`
- Background uses `--color-bg-tertiary`

### Loading State
- Show skeleton placeholders or spinner
- Dimmed interactive controls (`--color-text-muted`)

## Code Example

```tsx
export function PropertiesPanel() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        borderRight: `1px solid var(--color-border)`,
        padding: 'var(--spacing-lg)',
        width: '320px',
      }}
    >
      <section style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-strong)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Fill
        </h2>
        <FillInput />
      </section>

      <section style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-strong)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Effects
        </h2>
        {/* Effects controls */}
      </section>
    </div>
  );
}
```

## Cross-references

- See [FillInput](./fill-input.md) for color input pattern
- See [GradientEditor](./gradient-editor.md) for gradient editing
- See [Spacing](../foundations/spacing.md) for layout decisions
