# Typography Foundation

## Metadata
- Name: Typography System
- Category: Foundation
- Status: Production
- Last Updated: 2026-03-24

## Overview

Hawk-Eye typography is built on Geist Variable, a modern font optimized for screen rendering. The system provides clear scales for font sizes, weights, and line heights.

**When to use:**
- All text rendering in the UI
- Headers, labels, body text, helper text

**When not to use:**
- Do not create arbitrary font sizes
- Do not use weights outside the defined scale (500, 600, 700)

## Font Family

```css
--font-family-base: Geist Variable, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

Primary font is **Geist Variable** with system fallbacks for broad compatibility.

## Font Sizes

| Size | Pixels | CSS Token | Use Case |
|------|--------|-----------|----------|
| xs | 11px | `--font-size-xs` | Helper text, captions |
| sm | 12px | `--font-size-sm` | Labels, small UI text |
| base | 16px | `--font-size-base` | Body text, default |
| lg | 17px | `--font-size-lg` | Larger text, headers |

## Font Weights

| Weight | Value | CSS Token | Use Case |
|--------|-------|-----------|----------|
| Medium | 500 | `--font-weight-base` | Default text weight |
| Semibold | 600 | `--font-weight-strong` | Labels, secondary headers |
| Bold | 700 | `--font-weight-bold` | Emphasis, primary headers |

## Line Heights

| Scale | Value | CSS Token | Use Case |
|-------|-------|-----------|----------|
| Tight | 1 | `--line-height-tight` | Single lines, headings |
| Normal | 1.4 | `--line-height-normal` | Body text, standard |
| Relaxed | 1.5 | `--line-height-relaxed` | Long-form content |

## Letter Spacing

| Scale | Value | CSS Token | Use Case |
|-------|-------|-----------|----------|
| Tight | -0.02em | `--letter-spacing-tight` | Tracking (visual tightening) |
| Normal | 0 | `--letter-spacing-normal` | Default |
| Loose | 0.04em | `--letter-spacing-loose` | Emphasis, all-caps |

## Typography Patterns

### Display Text (Headers)
```css
font-family: var(--font-family-base);
font-size: var(--font-size-lg);
font-weight: var(--font-weight-bold);
line-height: var(--line-height-tight);
```

### Body Text
```css
font-family: var(--font-family-base);
font-size: var(--font-size-base);
font-weight: var(--font-weight-base);
line-height: var(--line-height-normal);
```

### Labels & Small Text
```css
font-family: var(--font-family-base);
font-size: var(--font-size-sm);
font-weight: var(--font-weight-strong);
line-height: var(--line-height-tight);
```

### Helper Text & Captions
```css
font-family: var(--font-family-base);
font-size: var(--font-size-xs);
font-weight: var(--font-weight-base);
line-height: var(--line-height-tight);
```

## Usage Examples

```css
/* ✅ Good: Use typography tokens */
h1 {
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.label {
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-strong);
  line-height: var(--line-height-tight);
}

.body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-base);
  line-height: var(--line-height-normal);
}

/* ❌ Bad: Hardcoded values */
h1 {
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
}

.label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
```

## Accessibility

- **Minimum size:** Never go below `--font-size-xs` (11px) for readable text
- **Contrast:** Ensure sufficient color contrast (see [Color](./color.md))
- **Line length:** Keep to ~70-80 characters for readability
- **Line height:** Use at least 1.4 for body text to improve readability

## States

### Default State
Use base font weight (500) and size (16px).

### Emphasis
Use `--font-weight-bold` (700) for important text.

### De-emphasis
Use `--font-size-xs` for secondary information.

### Disabled State
Use `--color-text-disabled` with `--font-weight-base`.

## Cross-references

- See [Color](./color.md) for text color tokens
- See [Spacing](./spacing.md) for line spacing and paragraph margins
- See [Token Reference](../tokens/token-reference.md) for all typography variables
