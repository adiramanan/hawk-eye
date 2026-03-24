# Token Reference

## Master Map of All CSS Variables

This document is the authoritative reference for all CSS tokens available in the Hawk-Eye design system. Tokens are organized into two layers: primitives (Layer 1) and semantic aliases (Layer 2).

**Use Layer 2 tokens in your code. Layer 1 tokens are for reference only.**

---

## Colors

### Layer 2: Semantic Color Tokens (USE THESE)

#### Background Colors
- `--color-bg` — Primary background (dark)
- `--color-bg-secondary` — Secondary background
- `--color-bg-tertiary` — Tertiary background

#### Foreground Colors
- `--color-fg` — Primary foreground (light)
- `--color-fg-secondary` — Secondary foreground
- `--color-fg-tertiary` — Tertiary foreground

#### Border Colors
- `--color-border` — Primary border
- `--color-border-subtle` — Subtle borders, dividers
- `--color-divider` — Element dividers

#### Interactive/Accent Colors
- `--color-accent` — Primary interactive color (#0d87f7)
- `--color-accent-hover` — Hover state (#0f6df1)
- `--color-accent-active` — Active/pressed state (#1246ab)

#### Semantic Status Colors
- `--color-success` — Success state (#22c55e)
- `--color-warning` — Warning/dirty state (#f59e0b)
- `--color-error` — Error/destructive state (#ef4444)
- `--color-info` — Informational state (#0d87f7)

#### Input States
- `--color-input-bg` — Input field background
- `--color-input-border` — Input border
- `--color-input-hover` — Input hover state
- `--color-input-focus` — Input focus ring color

#### Text Colors
- `--color-text-primary` — Primary text (light)
- `--color-text-secondary` — Secondary text (labels)
- `--color-text-tertiary` — Tertiary text (help text)
- `--color-text-muted` — Muted text
- `--color-text-disabled` — Disabled text

### Layer 1: Primitive Color Tokens (Reference Only)

#### Neutral Scale
- `--ds-gray-50` — #f8f8f8
- `--ds-gray-100` — #f0f0f0
- `--ds-gray-200` — #e0e0e0
- `--ds-gray-300` — #d0d0d0
- `--ds-gray-400` — #b0b0b0
- `--ds-gray-500` — #808080
- `--ds-gray-600` — #666666
- `--ds-gray-700` — #505050
- `--ds-gray-800` — #383838
- `--ds-gray-900` — #1a1a1a
- `--ds-black` — #000000
- `--ds-white` — #ffffff

#### Semantic Primitives
- `--ds-blue-400` — #0d87f7 (primary accent)
- `--ds-blue-500` — #0f6df1 (accent hover)
- `--ds-blue-600` — #1246ab (accent active)
- `--ds-red-400` — #ef4444 (error)
- `--ds-amber-400` — #f59e0b (warning)
- `--ds-green-400` — #22c55e (success)

---

## Spacing

### Layer 2: Spacing Aliases (USE THESE)

- `--spacing-xs` — 4px (extra small)
- `--spacing-sm` — 6px (small)
- `--spacing-base` — 8px (base unit)
- `--spacing-md` — 12px (medium)
- `--spacing-lg` — 16px (large)
- `--spacing-xl` — 24px (extra large)
- `--spacing-2xl` — 32px (2x large)
- `--spacing-3xl` — 48px (3x large)

### Layer 1: Primitive Spacing Tokens (Reference Only)

- `--ds-space-1` — 4px
- `--ds-space-2` — 6px
- `--ds-space-3` — 8px
- `--ds-space-4` — 12px
- `--ds-space-5` — 16px
- `--ds-space-6` — 24px
- `--ds-space-7` — 32px
- `--ds-space-8` — 48px

---

## Typography

### Layer 2: Typography Aliases (USE THESE)

#### Font Family
- `--font-family-base` — Geist Variable, system fallbacks

#### Font Sizes
- `--font-size-xs` — 11px
- `--font-size-sm` — 12px
- `--font-size-base` — 16px
- `--font-size-lg` — 17px

#### Font Weights
- `--font-weight-base` — 500 (medium)
- `--font-weight-strong` — 600 (semibold)
- `--font-weight-bold` — 700 (bold)

#### Line Heights
- `--line-height-tight` — 1
- `--line-height-normal` — 1.4
- `--line-height-relaxed` — 1.5

#### Letter Spacing
- `--letter-spacing-tight` — -0.02em
- `--letter-spacing-normal` — 0
- `--letter-spacing-loose` — 0.04em

### Layer 1: Primitive Typography Tokens (Reference Only)

- `--ds-font-sans` — Geist Variable, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- `--ds-font-size-11` — 11px
- `--ds-font-size-12` — 12px
- `--ds-font-size-16` — 16px
- `--ds-font-size-17` — 17px
- `--ds-font-weight-medium` — 500
- `--ds-font-weight-semibold` — 600
- `--ds-font-weight-bold` — 700
- `--ds-line-height-tight` — 1
- `--ds-line-height-normal` — 1.4
- `--ds-line-height-relaxed` — 1.5

---

## Border Radius

### Layer 2: Radius Aliases (USE THESE)

- `--radius-xs` — 3px (subtle rounding)
- `--radius-sm` — 4px (standard buttons, inputs)
- `--radius-md` — 8px (cards, panels)
- `--radius-lg` — 20px (large containers)
- `--radius-full` — 999px (pills, circles)

### Layer 1: Primitive Radius Tokens (Reference Only)

- `--ds-radius-xs` — 3px
- `--ds-radius-sm` — 4px
- `--ds-radius-md` — 8px
- `--ds-radius-lg` — 20px
- `--ds-radius-full` — 999px

---

## Shadows (Elevation)

### Layer 2: Shadow Aliases (USE THESE)

- `--shadow-sm` — 0 8px 18px rgba(17, 24, 39, 0.12) (subtle)
- `--shadow-md` — 0 12px 28px rgba(17, 24, 39, 0.16) (standard)
- `--shadow-lg` — 0 16px 32px rgba(17, 24, 39, 0.18) (prominent)
- `--shadow-xl` — 0 24px 90px rgba(6, 11, 17, 0.28) (maximum)

### Layer 1: Primitive Shadow Tokens (Reference Only)

- `--ds-shadow-sm` — 0 8px 18px rgba(17, 24, 39, 0.12)
- `--ds-shadow-md` — 0 12px 28px rgba(17, 24, 39, 0.16)
- `--ds-shadow-lg` — 0 16px 32px rgba(17, 24, 39, 0.18)
- `--ds-shadow-xl` — 0 24px 90px rgba(6, 11, 17, 0.28)

---

## Blur Effects

### Layer 2: Blur Aliases (USE THESE)

- `--blur-xs` — 4px
- `--blur-sm` — 5px
- `--blur-md` — 12px
- `--blur-lg` — 18px

### Layer 1: Primitive Blur Tokens (Reference Only)

- `--ds-blur-xs` — 4px
- `--ds-blur-sm` — 5px
- `--ds-blur-md` — 12px
- `--ds-blur-lg` — 18px

---

## Motion (Animations & Transitions)

### Layer 2: Motion Aliases (USE THESE)

#### Durations
- `--duration-fast` — 140ms (quick feedback)
- `--duration-base` — 180ms (standard transitions)
- `--duration-slow` — 220ms (noticeable changes)
- `--duration-slower` — 280ms (prominent animations)
- `--duration-slowest` — 780ms (complex sequences)

#### Easing Functions
- `--easing-standard` — cubic-bezier(0.23, 1, 0.32, 1) (in-out)
- `--easing-out` — cubic-bezier(0.77, 0, 0.175, 1) (ease-out)

### Layer 1: Primitive Motion Tokens (Reference Only)

- `--ds-duration-fast` — 140ms
- `--ds-duration-base` — 180ms
- `--ds-duration-slow` — 220ms
- `--ds-duration-slower` — 280ms
- `--ds-duration-slowest` — 780ms
- `--ds-easing-in-out` — cubic-bezier(0.23, 1, 0.32, 1)
- `--ds-easing-out` — cubic-bezier(0.77, 0, 0.175, 1)

---

## Z-Index

### Layer 2: Z-Index Aliases (USE THESE)

- `--z-dropdown` — 1000 (floating dropdowns)
- `--z-modal` — 1050 (modals and dialogs)
- `--z-tooltip` — 1070 (tooltips, highest interactive)
- `--z-max` — 2147483647 (maximum layer)

### Layer 1: Primitive Z-Index Tokens (Reference Only)

- `--ds-z-base` — 1
- `--ds-z-dropdown` — 1000
- `--ds-z-sticky` — 1020
- `--ds-z-fixed` — 1030
- `--ds-z-modal-backdrop` — 1040
- `--ds-z-modal` — 1050
- `--ds-z-popover` — 1060
- `--ds-z-tooltip` — 1070
- `--ds-z-max` — 2147483647

---

## Quick Reference Table

| Category | Token Count | Primary Use |
|----------|-------------|------------|
| Colors | 40+ | UI backgrounds, text, interactive states |
| Spacing | 8 | Padding, margin, gaps |
| Typography | 13 | Font sizes, weights, line heights |
| Border Radius | 5 | Button and panel corners |
| Shadows | 4 | Elevation and depth |
| Blur Effects | 4 | Modal and overlay treatment |
| Motion | 7 | Animations and transitions |
| Z-Index | 4 | Layering and stacking |

**Total Layer 2 Tokens: 85+**

---

## Usage Rules

1. **Use Layer 2 tokens in all CSS/JS code**
2. **Never hardcode colors, spacing, or typography values**
3. **Run `npm run token-audit` before committing to check for violations**
4. **Layer 1 tokens are for reference and extending the system only**

---

## See Also

- [Foundations](../foundations/) — Detailed guidelines for each category
- [Components](../components/) — Component-specific token usage
