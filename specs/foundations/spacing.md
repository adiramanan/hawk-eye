# Spacing Foundation

## Metadata
- Name: Spacing System
- Category: Foundation
- Status: Production
- Last Updated: 2026-03-24

## Overview

Hawk-Eye uses an 8-step spacing scale based on a 4px grid. This ensures consistent rhythm and alignment across the interface.

**When to use:**
- Padding (internal space inside components)
- Margin (external space outside components)
- Gap (space between flex/grid items)
- Component sizing and layouts

**When not to use:**
- Do not use arbitrary pixel values like `7px` or `13px`
- Do not hardcode spacing in inline styles

## Spacing Scale

| Step | Pixel | CSS Token | Use Case |
|------|-------|-----------|----------|
| xs | 4px | `--spacing-xs` | Tight spacing, icon padding |
| sm | 6px | `--spacing-sm` | Small gaps |
| base | 8px | `--spacing-base` | Default spacing unit |
| md | 12px | `--spacing-md` | Moderate spacing |
| lg | 16px | `--spacing-lg` | Generous spacing |
| xl | 24px | `--spacing-xl` | Large spacing, panels |
| 2xl | 32px | `--spacing-2xl` | Extra large spacing |
| 3xl | 48px | `--spacing-3xl` | Maximum spacing |

## Foundational Units

- **4px grid**: All spacing is a multiple of 4px for pixel-perfect alignment
- **Hierarchy**: Use smaller values for compact components, larger values for breathing room
- **Consistency**: Apply same spacing units throughout the UI for visual harmony

## Common Patterns

### Padding

```css
/* Compact elements (buttons, inputs) */
padding: var(--spacing-sm) var(--spacing-md);  /* 6px 12px */

/* Standard panels and cards */
padding: var(--spacing-lg);  /* 16px */

/* Large content areas */
padding: var(--spacing-xl);  /* 24px */
```

### Margin

```css
/* Stack elements with vertical rhythm */
margin-bottom: var(--spacing-md);  /* 12px */

/* Separate sections */
margin-bottom: var(--spacing-xl);  /* 24px */
```

### Gap (Flex/Grid)

```css
/* Flex row (horizontal items) */
gap: var(--spacing-md);  /* 12px */

/* Flex column (stacked items) */
gap: var(--spacing-base);  /* 8px */

/* Grid layout */
gap: var(--spacing-lg);  /* 16px */
```

## Component Examples

### Button Padding
- Small button: `padding: var(--spacing-xs) var(--spacing-md);` (4px 12px)
- Medium button: `padding: var(--spacing-sm) var(--spacing-lg);` (6px 16px)
- Large button: `padding: var(--spacing-base) var(--spacing-xl);` (8px 24px)

### Input Padding
- Standard input: `padding: var(--spacing-sm) var(--spacing-md);` (6px 12px)

### Section Spacing
- Between sections: `margin: var(--spacing-xl) 0;` (24px vertical)
- Within section: `gap: var(--spacing-md);` (12px)

### Layered Lists
Dynamic nesting uses a formula. In LayersPanel:
```tsx
// Base unit is 12px (from spacing-md rounded up)
paddingLeft: ${node.depth * 12}px
```

## Usage Examples

```css
/* ✅ Good: Use spacing tokens */
.panel {
  padding: var(--spacing-lg);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.item {
  padding: var(--spacing-base) var(--spacing-md);
  margin-bottom: var(--spacing-base);
}

/* ❌ Bad: Hardcoded values */
.panel {
  padding: 16px;
  gap: 12px;
  margin-bottom: 24px;
}

.item {
  padding: 8px 12px;
  margin-bottom: 8px;
}
```

## Responsive Adjustments

For responsive layouts, use:
- Smaller spacing values on mobile (e.g., `--spacing-base` instead of `--spacing-lg`)
- Larger spacing values on desktop
- Adjust at breakpoints as needed

## Cross-references

- See [Token Reference](../tokens/token-reference.md) for all spacing variables
- See component specs for spacing usage in specific UI patterns
