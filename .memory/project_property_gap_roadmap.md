---
name: Property gap roadmap vs paper.design
description: Phased plan to close hawk-eye's property-support gaps relative to paper.design, prioritized by developer impact
type: project
---

Hawk-eye was compared 1:1 against paper.design for supported CSS/design properties. Eight gap areas were identified and prioritized into implementation phases.

**Why:** Paper.design supports transforms, gradients, transitions, structured filter editors, HSL/oklch color formats, CSS variables, and export/copy-as-code — all absent from hawk-eye. Closing these gaps makes hawk-eye a complete design-inspection companion for developers.

**How to apply:** Use this as the canonical backlog order when planning sprints. Phases 1–2 are zero-infrastructure (pure property definitions), phases 3–4 need new compound control components, phases 5–6 need architectural changes, phases 7–8 are additive.

---

## Phases (ordered by value-per-effort)

### Phase 1 — Advanced Typography (fastest, zero new controls)
- `textOverflow` (`text-overflow`) — select: clip, ellipsis
- `whiteSpace` (`white-space`) — select: normal, nowrap, pre, pre-wrap, pre-line
- `wordBreak` (`word-break`) — select: normal, break-all, keep-all, break-word
- `overflowWrap` (`overflow-wrap`) — select: normal, break-word, anywhere
- `lineClamp` (`-webkit-line-clamp`) — number; side-effect: sets overflow:hidden + display:-webkit-box
- Files: `types.ts`, `editable-properties.ts`, `PropertiesPanel.tsx`

### Phase 2 — Transition Properties (fast, 4 properties)
- `transitionProperty`, `transitionDuration` (ms/s), `transitionTimingFunction` (select), `transitionDelay` (ms/s)
- Files: `types.ts`, `editable-properties.ts`, `PropertiesPanel.tsx` (new TransitionSection)

### Phase 3 — CSS Transforms (compound editor, high impact)
- 7 sub-properties: rotate, scaleX/Y, translateX/Y, skewX/Y + transformOrigin
- New `controls/TransformEditor.tsx` following `BoxShadowInput.tsx` pattern
- Parse/compose full `transform` string on read/write
- Files: `types.ts`, `editable-properties.ts`, `controls/TransformEditor.tsx`, `PropertiesPanel.tsx`, `drafts.ts`

### Phase 4 — Filter/Backdrop Filter Structured UI
- No type changes — `filter` and `backdropFilter` IDs already exist
- New `controls/FilterEditor.tsx` with per-function sliders
- Files: `controls/FilterEditor.tsx`, `PropertiesPanel.tsx`

### Phase 5 — Color Picker Format Enhancement (HSL / RGB)
- Format toggle (Hex | RGB | HSL) in `ColorPicker.tsx`
- Color utilities already exist in `utils/color.ts`
- Files: `controls/ColorPicker.tsx`, `utils/color.ts`

### Phase 6 — Gradient Fills (most disruptive)
- New `controls/FillInput.tsx` + `controls/GradientEditor.tsx`
- `backgroundColor` must migrate cssProperty from `background-color` → `background`
- Requires vite-plugin Tailwind writer update
- Files: 2 new controls, `editable-properties.ts`, `PropertiesPanel.tsx`, `packages/vite-plugin/`

### Phase 7 — CSS Custom Properties Viewer
- Outside `EditablePropertyId` system — dynamic enumeration via `getComputedStyle`
- New `utils/css-variables.ts` + `CssVariablesSection` in panel
- Read-only first, editable later via `element.style.setProperty()`

### Phase 8 — Export / Copy as Code
- "Copy" button in inspector header: Copy inline CSS + Copy Tailwind
- `tailwindPrefix` fields already present on property definitions
- New `utils/copy-as-code.ts`; update `Inspector.tsx`

---

## Key architecture files
- `packages/client/src/types.ts` — EditablePropertyId union (update first)
- `packages/client/src/editable-properties.ts` — Central registry
- `packages/client/src/PropertiesPanel.tsx` — Section rendering
- `packages/client/src/controls/BoxShadowInput.tsx` — Reference pattern for compound editors
- `packages/client/src/utils/color.ts` — Color conversion utilities
- `packages/client/src/drafts.ts` — Snapshot building (transform parsing needed)
