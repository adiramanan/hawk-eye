# Design-Code Component Mapping

This document maintains 1:1 parity between Figma design components and code implementations.

**Last Updated:** 2026-03-26
**Figma File:** [Hawk-Eye Design System](https://www.figma.com/design/vG3KEIITbug7IJSTJ4kaTS/Hawk-Eye)
**Note:** Professional plan - Code Connect unavailable. Maintaining manual parity.

---

## Component Mappings

### 1. Icon System

| Figma | Code | Props | Notes |
|-------|------|-------|-------|
| **Icon frame** (142:5056) | `packages/client/src/components/Icon.tsx` | `type`, `state`, `size` | 13 icon types × 3 states (36 variants) |
| Icon=refresh, Style=normal | Icon: `type="refresh"` `state="normal"` | - | Outline style icon |
| Icon=refresh, Style=inactive | Icon: `type="refresh"` `state="inactive"` | - | Grayed disabled state |
| Icon=refresh, Style=active | Icon: `type="refresh"` `state="active"` | - | Blue filled active state |
| Icon=hide, Style=* | Icon: `type="hide"` | - | 3 states (normal/inactive/active) |
| Icon=roller-brush, Style=* | Icon: `type="roller-brush"` | - | 3 states (normal/inactive/active) |
| Icon=padding-lock, Style=* | Icon: `type="padding-lock"` | - | 3 states (normal/inactive/active) |
| Icon=link-broken, Style=* | Icon: `type="link-broken"` | - | 3 states (normal/inactive/active) |
| Icon=x-square, Style=* | Icon: `type="x-square"` | - | 3 states (normal/inactive/active) |
| Icon=grid, Style=* | Icon: `type="grid"` | - | 3 states (normal/inactive/active) |
| Icon=align-top, Style=* | Icon: `type="align-top"` | - | 3 states (normal/inactive/active) |
| Icon=align-left, Style=* | Icon: `type="align-left"` | - | 3 states (normal/inactive/active) |
| Icon=align-center, Style=* | Icon: `type="align-center"` | - | 3 states (normal/inactive/active) |
| Icon=align-right, Style=* | Icon: `type="align-right"` | - | 3 states (normal/inactive/active) |
| Icon=align-justify, Style=* | Icon: `type="align-justify"` | - | 3 states (normal/inactive/active) |
| Icon=stop-square, Style=* | Icon: `type="stop-square"` | - | 3 states (normal/inactive/active) |

**Color Token Mapping:**
- `state="normal"`: `currentColor` (inherits text color)
- `state="inactive"`: `var(--color-text-disabled)`
- `state="active"`: `var(--color-accent)`

**Usage:**
```tsx
<Icon type="refresh" state="normal" size={20} />
<Icon type="hide" state="active" />
```

---

### 2. Input Box

| Figma | Code | Props | Notes |
|-------|------|-------|-------|
| **Input Box frame** (139:4043) | `packages/client/src/components/InputBox.tsx` | `label`, `prefix`, `suffix`, `modifier`, `children` | 16 variants covering all slot combinations |
| Label=True, Prefix=True, Suffix=True, Modifier=True | InputBox: all props provided | All | Full configuration |
| Label=True, Prefix=False, Suffix=True, Modifier=False | InputBox: `label`, `suffix`, children | - | Minimal config |
| Label=False, Prefix=False, Suffix=False, Modifier=False | InputBox: children only | - | Bare input |
| ... | ... | ... | All 16 combinations supported |

**Slot Mapping:**
- `label`: Optional label above input
- `prefix`: Content before input (icon, label)
- `suffix`: Content after input (unit dropdown, icon)
- `modifier`: Additional control button/toggle

**Design Token Usage:**
- Label: `var(--font-size-xs)`, `var(--color-text-secondary)`
- Input: `var(--color-input-bg)`, `var(--color-input-border)`
- Spacing: `var(--spacing-xs)`, `var(--spacing-md)`

**Usage:**
```tsx
<InputBox label="Width" suffix={<UnitSelector />}>
  <input type="text" placeholder="Value" />
</InputBox>
```

---

### 3. Font Picker

| Figma | Code | Props | Notes |
|-------|------|-------|-------|
| **Font Picker** (139:3301) | `packages/client/src/controls/FontPicker.tsx` | `value`, `onChange`, `onClose` | Dropdown font selector |

**Features:**
- Searchable dropdown
- 10 preloaded fonts
- Custom font support via text input
- Hover states using design tokens

**Design Tokens:**
- Trigger: `var(--color-input-bg)`, `var(--color-input-border)`
- Dropdown: `var(--color-bg-secondary)`, `var(--shadow-md)`
- Options: `var(--color-selection-bg)` on hover

**Usage:**
```tsx
<FontPicker
  value="Inter, sans-serif"
  onChange={(font) => updateFont(font)}
/>
```

---

### 4. Color Picker

| Figma | Code | Props | Notes |
|-------|------|-------|-------|
| **Color Picker** (139:3302) | `packages/client/src/controls/ColorPicker.tsx` | `id`, `label`, `value`, `onChange`, `onClose`, `anchorRect` | HSV color picker |

**Features:**
- HSV color space picker
- Hex input field
- Alpha (opacity) slider
- Swatch preview

**Design Tokens:**
- Canvas: Uses CSS gradients (inline styles)
- Sliders: `var(--color-input-bg)`, `var(--color-input-border)`
- Text: `var(--font-size-xs)`, `var(--color-text-primary)`

**Usage:**
```tsx
<ColorPicker
  id="bg-color"
  label="Background"
  value="#ff0000"
  onChange={(color) => updateColor(color)}
/>
```

---

### 5. Edits List

| Figma | Code | Props | Notes |
|-------|------|-------|-------|
| **Edits List frame** (145:7225) | `packages/client/src/components/EditsList.tsx` | `edits`, `variant`, `onReset`, `onUndo` | 2 variants (Default/Reset) |
| Property 1=Default | EditsList: `variant="default"` | `edits`, `onUndo` | Shows list of changes |
| Property 1=Reset | EditsList: `variant="reset"` | `onReset` | Empty state with reset button |

**Data Structure:**
```tsx
interface Edit {
  id: string;
  propertyName: string;
  previousValue: string;
  newValue: string;
  timestamp: number;
}
```

**Design Tokens:**
- Container: `var(--color-bg-secondary)`, `var(--spacing-lg)`
- Items: `var(--color-bg-tertiary)`, `var(--color-border)`
- Buttons: `var(--color-accent)` on hover
- Text: `var(--font-size-sm)`, `var(--color-text-primary)`

**Usage:**
```tsx
<EditsList
  edits={[
    {
      id: '1',
      propertyName: 'color',
      previousValue: '#000',
      newValue: '#fff',
      timestamp: Date.now()
    }
  ]}
  variant="default"
  onUndo={(id) => undoChange(id)}
/>
```

---

## Design Token Reference

All components use these semantic tokens (no hardcoded values):

### Colors
- `--color-bg` - Primary background
- `--color-bg-secondary` - Secondary background
- `--color-bg-tertiary` - Tertiary background
- `--color-text-primary` - Primary text
- `--color-text-secondary` - Secondary text
- `--color-text-disabled` - Disabled text
- `--color-input-bg` - Input background
- `--color-input-border` - Input border
- `--color-input-hover` - Input hover state
- `--color-accent` - Interactive accent
- `--color-accent-hover` - Accent hover
- `--color-error` - Error/validation state

### Spacing
- `--spacing-xs` (4px) - Extra small
- `--spacing-sm` (6px) - Small
- `--spacing-base` (8px) - Base
- `--spacing-md` (12px) - Medium
- `--spacing-lg` (16px) - Large
- `--spacing-xl` (24px) - Extra large

### Typography
- `--font-size-xs` (11px) - Extra small
- `--font-size-sm` (12px) - Small
- `--font-size-base` (16px) - Base
- `--font-size-lg` (17px) - Large
- `--font-weight-base` (500) - Medium
- `--font-weight-strong` (600) - Semibold

### Radius & Shadow
- `--radius-sm` (4px) - Small
- `--radius-md` (8px) - Medium
- `--shadow-sm` - Small elevation
- `--shadow-md` - Medium elevation

---

## Parity Verification Checklist

Run these checks to ensure design-code parity:

```bash
# 1. Token audit - verify no hardcoded values
npm run token-audit

# 2. Component export verification
grep -r "export.*Icon\|export.*InputBox\|export.*FontPicker\|export.*EditsList\|export.*ColorPicker" packages/client/src/

# 3. TypeScript compilation check
npx tsc --noEmit

# 4. Visual regression test (when available)
npm run test:visual
```

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-26 | Initial component mapping | All 5 components documented |
| - | Token migration complete | Zero hardcoded values |
| - | Design token audit passing | Full compliance |

---

## References

- **Figma File:** https://www.figma.com/design/vG3KEIITbug7IJSTJ4kaTS/Hawk-Eye
- **Token Reference:** `specs/tokens/token-reference.md`
- **Design Specs:** `specs/foundations/`
- **Component Code:** `packages/client/src/components/`, `packages/client/src/controls/`

---

## Maintenance

**To maintain parity when making changes:**

1. **Design changes in Figma** → Update corresponding code component
2. **Code changes** → Update this mapping document if props/structure changes
3. **Token changes** → Run `npm run token-audit` to verify compliance
4. **Monthly audit** → Compare Figma components with code using this document

**Questions?** See CLAUDE.md for design system guidelines.
