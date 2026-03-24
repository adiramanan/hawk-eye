# Hawk-Eye Design System Specification

Welcome to the Hawk-Eye design system documentation. This directory contains all design foundations, token specifications, and component documentation.

## Quick Start

1. **Read the relevant foundation** before designing or building UI:
   - [Color](./foundations/color.md) - Color palette and accessibility
   - [Spacing](./foundations/spacing.md) - Spacing scale and usage
   - [Typography](./foundations/typography.md) - Font families, sizes, weights
   - [Border Radius](./foundations/radius.md) - Border radius scale
   - [Elevation](./foundations/elevation.md) - Shadow system
   - [Motion](./foundations/motion.md) - Animations and transitions

2. **Use tokens from the token reference**:
   - [Token Reference](./tokens/token-reference.md) - Master map of all CSS variables

3. **Check component specs** for examples:
   - Browse [Components](./components/) for specific UI patterns

## Architecture

The design system uses a 3-layer token architecture:

### Layer 1: Upstream Design System (--ds-* prefix)
Primitive tokens defining the base design system. These are rarely changed.

### Layer 2: Project Aliases (semantic tokens)
Semantic layer that wraps Layer 1 with fallbacks. **Use these in your code.**

### Layer 3: Component CSS
Component implementations that only reference Layer 2 tokens.

## Rules

✅ **DO:**
- Use tokens from `tokens.css` Layer 2 in all CSS/JS styling
- Reference the relevant spec file before building components
- Run `npm run token-audit` before committing
- Keep components simple and focused

❌ **DON'T:**
- Use hardcoded colors like `#f8f8f8` or `rgb(248, 248, 248)`
- Use raw spacing like `12px` or `1rem` (use token aliases instead)
- Use arbitrary font sizes or weights
- Add new values without updating specs and tokens

## File Structure

```
specs/
├── README.md (this file)
├── foundations/
│   ├── color.md
│   ├── spacing.md
│   ├── typography.md
│   ├── radius.md
│   ├── elevation.md
│   └── motion.md
├── tokens/
│   └── token-reference.md
└── components/
    ├── properties-panel.md
    ├── color-picker.md
    ├── gradient-editor.md
    ├── layers-panel.md
    └── ...
```

## Token File Location

Main token definitions: `packages/client/src/tokens.css`

Audit script: `scripts/token-audit.js`

## Questions?

Refer to the specific foundation or component spec. If a token or pattern isn't documented, propose adding it to the design system.
