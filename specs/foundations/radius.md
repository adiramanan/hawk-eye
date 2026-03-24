# Border Radius Foundation

## Metadata
- Name: Border Radius System
- Category: Foundation
- Status: Production
- Last Updated: 2026-03-24

## Overview

Hawk-Eye uses a controlled border radius scale for consistent corner treatments across the interface. Radii range from sharp (3px) to fully rounded (999px pill).

**When to use:**
- Button and input corner rounding
- Card and panel corner treatments
- Icon containers and badges
- Avatar images

**When not to use:**
- Do not use arbitrary radius values
- Do not hardcode pixel values in CSS

## Border Radius Scale

| Scale | Pixels | CSS Token | Use Case |
|-------|--------|-----------|----------|
| xs | 3px | `--radius-xs` | Subtle rounding, crisp appearance |
| sm | 4px | `--radius-sm` | Default UI elements (buttons, inputs) |
| md | 8px | `--radius-md` | Panels, cards, larger components |
| lg | 20px | `--radius-lg` | Large containers, feature cards |
| full | 999px | `--radius-full` | Pill shapes, circular badges |

## Usage Patterns

### Button Corners
```css
border-radius: var(--radius-sm);  /* 4px - Standard buttons */
```

### Input Field Corners
```css
border-radius: var(--radius-sm);  /* 4px - Input fields */
```

### Panel/Card Corners
```css
border-radius: var(--radius-md);  /* 8px - Cards and panels */
```

### Large Container Corners
```css
border-radius: var(--radius-lg);  /* 20px - Feature cards, modals */
```

### Circular/Pill Shapes
```css
border-radius: var(--radius-full);  /* 999px - Badges, avatars */
```

## Usage Examples

```css
/* ✅ Good: Use radius tokens */
.button {
  border-radius: var(--radius-sm);
}

.card {
  border-radius: var(--radius-md);
}

.badge {
  border-radius: var(--radius-full);
}

/* ❌ Bad: Hardcoded values */
.button {
  border-radius: 4px;
}

.card {
  border-radius: 8px;
}

.badge {
  border-radius: 999px;
}
```

## Stacking with Shadows

Border radius works with the [Elevation](./elevation.md) system. Shadows are clipped by border radius, so they work together seamlessly.

## Cross-references

- See [Elevation](./elevation.md) for shadow effects on rounded corners
- See [Token Reference](../tokens/token-reference.md) for all radius variables
