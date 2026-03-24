# Color Foundation

## Metadata
- Name: Color System
- Category: Foundation
- Status: Production
- Last Updated: 2026-03-24

## Overview

The Hawk-Eye color system uses a dark theme optimized for long design sessions. Colors are organized into semantic categories: neutrals, interactive states, semantic meanings (success, warning, error), and legacy branding colors.

**When to use:**
- All UI text, backgrounds, borders, and interactive elements
- Status indicators and semantic feedback
- Hover and active states

**When not to use:**
- Do not create new custom colors; extend the system through tokens instead
- Do not hardcode hex values in CSS

## Color Scale

### Neutrals (Grays)

The neutral scale provides a foundation for all UI elements.

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| Gray 50 | `--ds-gray-50` | Lightest neutral, rarely used |
| Gray 100 | `--ds-gray-100` | Light backgrounds |
| Gray 200 | `--ds-gray-200` | Light borders |
| Gray 300 | `--ds-gray-300` | Subtle dividers |
| Gray 400 | `--ds-gray-400` | Secondary text |
| Gray 500 | `--ds-gray-500` | Muted elements |
| Gray 600 | `--ds-gray-600` | Tertiary text, disabled |
| Gray 700 | `--ds-gray-700` | Primary borders |
| Gray 800 | `--ds-gray-800` | Secondary backgrounds |
| Gray 900 | `--ds-gray-900` | Primary background |

### Semantic Colors

#### Interactive (Blue)
```css
--ds-blue-400: #0d87f7  /* Primary accent, interactive elements */
--ds-blue-500: #0f6df1  /* Hover state */
--ds-blue-600: #1246ab  /* Active state */
```
**Use for:** Links, buttons, focus rings, interactive states

#### Success (Green)
```css
--ds-green-400: #22c55e
```
**Use for:** Success messages, valid states, confirmations

#### Warning (Amber)
```css
--ds-amber-400: #f59e0b
```
**Use for:** Warning messages, unsaved states ("dirty"), caution indicators

#### Error (Red)
```css
--ds-red-400: #ef4444
```
**Use for:** Error messages, destructive actions, invalid states

#### Info (Blue)
```css
--ds-blue-400: #0d87f7
```
**Use for:** Informational messages, tooltips

### Project-Level Aliases

Use these semantic tokens in your code:

| Alias | Purpose |
|-------|---------|
| `--color-accent` | Primary interactive color |
| `--color-accent-hover` | Hover state (darker accent) |
| `--color-accent-active` | Active/pressed state |
| `--color-success` | Success/valid states |
| `--color-warning` | Warning/dirty states |
| `--color-error` | Error/destructive states |
| `--color-info` | Informational feedback |
| `--color-text-primary` | Primary text color |
| `--color-text-secondary` | Secondary text (labels) |
| `--color-text-tertiary` | Tertiary text (help text) |
| `--color-text-muted` | Muted/disabled text |
| `--color-bg` | Primary background |
| `--color-bg-secondary` | Secondary background |
| `--color-border` | Primary border color |
| `--color-border-subtle` | Subtle borders, dividers |
| `--color-input-bg` | Input field background |
| `--color-input-border` | Input field border |
| `--color-input-focus` | Input focus ring |

## Usage Examples

```css
/* ✅ Good: Use semantic tokens */
.button {
  background-color: var(--color-accent);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.button:hover {
  background-color: var(--color-accent-hover);
}

.button:active {
  background-color: var(--color-accent-active);
}

/* ❌ Bad: Hardcoded colors */
.button {
  background-color: #0d87f7;
  color: #f8f8f8;
  border: 1px solid #505050;
}
```

## Accessibility

- **Contrast:** All text colors meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Color blindness:** System does not rely solely on color for meaning; use text, icons, or patterns
- **Focus indicators:** Interactive elements use `--color-accent` for focus rings

## States

### Default State
Use base colors from the color scale.

### Hover State
Use the `*-hover` variant (e.g., `--color-accent-hover`).

### Active State
Use the `*-active` variant (e.g., `--color-accent-active`).

### Disabled State
Use `--color-text-disabled` for text and `--color-bg-tertiary` for backgrounds.

### Focus State
Use `--color-accent` with a 2-4px ring around the element.

## Cross-references

- See [Elevation](./elevation.md) for shadow colors (inherent in shadow values)
- See [Token Reference](../tokens/token-reference.md) for full CSS variable list
- See component specs for color usage in specific UI elements
