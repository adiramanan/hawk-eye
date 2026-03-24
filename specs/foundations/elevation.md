# Elevation Foundation

## Metadata
- Name: Shadow System / Elevation
- Category: Foundation
- Status: Production
- Last Updated: 2026-03-24

## Overview

Hawk-Eye uses a 4-level shadow system to establish visual hierarchy and depth. Shadows create the illusion of elevation, helping users understand layering and importance.

**When to use:**
- Floating panels and dropdowns
- Cards and containers that float above background
- Modals and popovers
- Hover states on interactive elements

**When not to use:**
- Do not use shadows for borders or decorative purposes
- Do not hardcode shadow values in CSS

## Shadow System

| Level | CSS Token | Value | Use Case |
|-------|-----------|-------|----------|
| Small | `--shadow-sm` | `0 8px 18px rgba(17, 24, 39, 0.12)` | Subtle elevation, hover states |
| Medium | `--shadow-md` | `0 12px 28px rgba(17, 24, 39, 0.16)` | Standard floating elements |
| Large | `--shadow-lg` | `0 16px 32px rgba(17, 24, 39, 0.18)` | Prominent floating elements |
| Extra Large | `--shadow-xl` | `0 24px 90px rgba(6, 11, 17, 0.28)` | Maximum emphasis, modals |

## Shadow Anatomy

Each shadow is composed of:
- **Offset**: How far below the element the shadow appears (Y value)
- **Blur**: How soft/feathered the shadow is (blur-radius)
- **Spread**: How far the shadow extends (optional)
- **Color**: Always dark with opacity for consistency

Example breakdown:
```css
box-shadow: 0 12px 28px rgba(17, 24, 39, 0.16);
           ↑  ↑   ↑  ↑ ↑  ↑
           x offset blur opacity
                    (color: very dark gray)
```

## Usage Patterns

### Subtle Hover States
```css
.button:hover {
  box-shadow: var(--shadow-sm);
}
```

### Floating Panels
```css
.panel {
  box-shadow: var(--shadow-md);
}
```

### Dropdown Menus
```css
.dropdown {
  box-shadow: var(--shadow-md);
}
```

### Modal Dialogs
```css
.modal {
  box-shadow: var(--shadow-xl);
}
```

## Elevation Hierarchy

```
No Shadow      Subtle            Medium            Prominent         Maximum
(inline)  ->  (hover, sm) -> (floating) -> (featured) -> (modal)
              --shadow-sm      --shadow-md    --shadow-lg    --shadow-xl
```

Use this hierarchy to establish visual importance:
1. **Inline elements**: No shadow (buttons on backgrounds)
2. **Interactive hover**: `--shadow-sm` (user feedback)
3. **Floating components**: `--shadow-md` (panels, cards)
4. **Featured floats**: `--shadow-lg` (important panels)
5. **Modals/Topmost**: `--shadow-xl` (dialogs, overlays)

## Usage Examples

```css
/* ✅ Good: Use shadow tokens */
.card {
  box-shadow: var(--shadow-md);
}

.dropdown {
  box-shadow: var(--shadow-md);
}

.modal {
  box-shadow: var(--shadow-xl);
}

.button:hover {
  box-shadow: var(--shadow-sm);
}

/* ❌ Bad: Hardcoded values */
.card {
  box-shadow: 0 12px 28px rgba(17, 24, 39, 0.16);
}

.modal {
  box-shadow: 0 24px 90px rgba(6, 11, 17, 0.28);
}
```

## Stacking Shadows

When multiple elevated elements overlap, shadows compound naturally. Use z-index to control layering (see [Z-Index](../tokens/token-reference.md#z-index)).

## Accessibility

- Shadows should enhance, not replace, visual boundaries
- Do not rely on shadows alone to communicate state
- Combine shadows with color, borders, or text for clarity

## Combined with Border Radius

Shadows work seamlessly with [Border Radius](./radius.md). The shadow clips to the rounded corners automatically.

## Cross-references

- See [Border Radius](./radius.md) for corner treatments
- See [Color](./color.md) for color system (shadows use dark colors)
- See [Token Reference](../tokens/token-reference.md) for all elevation variables
