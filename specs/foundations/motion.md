# Motion Foundation

## Metadata
- Name: Motion System / Animations
- Category: Foundation
- Status: Production
- Last Updated: 2026-03-24

## Overview

Hawk-Eye uses a controlled motion system with defined durations and easing curves. Motion provides feedback, guides attention, and creates a sense of polish.

**When to use:**
- UI state changes (hover, focus, active)
- Transitions between pages or modals
- Loading states and progress indicators
- Micro-interactions and feedback

**When not to use:**
- Do not create arbitrary animation durations
- Do not use motion for passive elements
- Respect `prefers-reduced-motion` for accessibility

## Duration Scale

| Speed | Milliseconds | CSS Token | Use Case |
|-------|--------------|-----------|----------|
| Fast | 140ms | `--duration-fast` | Quick feedback (tooltips, hovers) |
| Base | 180ms | `--duration-base` | Standard transitions |
| Slow | 220ms | `--duration-slow` | Noticeable changes (page transitions) |
| Slower | 280ms | `--duration-slower` | Prominent animations |
| Slowest | 780ms | `--duration-slowest` | Complex keyframe animations |

## Easing Functions

### Standard (In-Out)
```css
--easing-standard: cubic-bezier(0.23, 1, 0.32, 1);
```
**Use for:** Most transitions, natural feel

### Out
```css
--easing-out: cubic-bezier(0.77, 0, 0.175, 1);
```
**Use for:** Entering animations, eye-catching movements

## Usage Patterns

### Simple Property Transition
```css
.element {
  transition: all var(--duration-base) var(--easing-standard);
}

.element:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Fade In Animation
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.element {
  animation: fadeIn var(--duration-base) var(--easing-out);
}
```

### Dropdown Open Animation
```css
.dropdown {
  animation: slideDown var(--duration-base) var(--easing-out);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Hover State Transition
```css
.button {
  transition: all var(--duration-fast) var(--easing-standard);
}

.button:hover {
  background-color: var(--color-accent-hover);
}
```

## Usage Examples

```css
/* ✅ Good: Use motion tokens */
.panel {
  transition: opacity var(--duration-base) var(--easing-standard);
}

.tooltip {
  animation: fadeIn var(--duration-fast) var(--easing-out);
}

.modal {
  animation: slideIn var(--duration-slow) var(--easing-standard);
}

/* ❌ Bad: Hardcoded values */
.panel {
  transition: opacity 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.tooltip {
  animation: fadeIn 140ms cubic-bezier(0.77, 0, 0.175, 1);
}

.modal {
  animation: slideIn 220ms ease-in-out;
}
```

## Duration Guidelines

| Animation Type | Recommended Duration |
|---|---|
| Opacity/Color change | `--duration-fast` (140ms) |
| Button hover feedback | `--duration-fast` (140ms) |
| Dropdown open/close | `--duration-base` (180ms) |
| Page transition | `--duration-slow` (220ms) |
| Modal entrance | `--duration-slow` (220ms) |
| Complex sequence | `--duration-slower` or `--duration-slowest` |

## Accessibility

### Respect Reduced Motion
Always respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

### Performance
- Keep animations short (< 500ms for most interactions)
- Use `transform` and `opacity` for smooth 60fps animations
- Avoid animating `top`, `left`, `width`, `height` (triggers layout)

## Common Animation Patterns

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Slide In (Top)
```css
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Slide In (Left)
```css
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Scale Pop
```css
@keyframes scalePop {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Cross-references

- See [Token Reference](../tokens/token-reference.md) for all motion variables
- See component specs for motion usage in specific UI patterns
