# Phase Progress Tracker

## Phase 0: Repository Setup & Configuration

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-07
**Completion Date:** 2026-03-07

### Checklist
- [x] Plan architecture and structure
- [x] Create agent memory system (`.agents/`)
- [x] Create directory structure (`packages/`, `demo/`, `docs/`, `tests/`)
- [x] Create root package.json with workspace scripts
- [x] Create `pnpm-workspace.yaml`
- [x] Create TypeScript config (root + per-package)
- [x] Create ESLint + Prettier config
- [x] Create `.nvmrc`, `.pnpmrc`, `.gitignore`
- [x] Create package manifests for `@hawk-eye/client`, `@hawk-eye/vite-plugin`, and `hawk-eye-demo`
- [x] Create build configs (`tsup.config.ts`, `demo/vite.config.ts`)
- [x] Create initial source scaffolds
- [x] Add truthful README, contributing guide, spec, and architecture notes
- [x] Add MIT license
- [x] Add a Phase 0 smoke-test baseline
- [x] Verify install, type-check, lint, test, and build
- [x] Create Phase 0 closeout commit

**Blockers:** None

**Next Phase Gate:** Phase 1 may begin immediately.

---

## Phase 1: Inspector Overlay & Source Injection

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-08
**Completion Date:** 2026-03-08
### Checklist
- [x] Implement source injection transform
- [x] Implement `DesignTool` trigger/inspector runtime
- [x] Implement Vite HMR bridge
- [x] Add Shadow DOM overlay isolation and rendering
- [x] Validate across common JSX patterns used in the demo

**Blockers:** None

**Next Phase Gate:** Phase 2 may begin immediately.

---

## Phase 2: Properties Panel & Live Preview

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-10
**Completion Date:** 2026-03-10

### Checklist
- [x] Render a guided properties panel for the locked selection
- [x] Read and normalize spacing, radius, color, typography, and opacity values
- [x] Apply live preview changes as DOM-only inline overrides
- [x] Keep session-scoped pending changes across selection switches
- [x] Support per-field reset, global reset, and inspector-exit cleanup
- [x] Add Phase 2 jsdom coverage and verify type-check, lint, test, build, and format checks

**Blockers:** None

**Next Phase Gate:** Phase 3 may begin immediately.

---

## Phase 2.1: Foundation — Type System & Property Definitions

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-10
**Completion Date:** 2026-03-10

### Checklist
- [x] Expand `EditablePropertyControl` union to include: number, slider, color, select, segmented, toggle, per-side
- [x] Add optional fields to `EditablePropertyDefinition`: options, min/max/step, units, sides, tailwindPrefix
- [x] Expand `EditablePropertyGroupId` to 10 groups: position, autoLayout, size, spacing, appearance, fill, stroke, typography, effects, layout
- [x] Grow `EditablePropertyId` from 15 to 53 members
- [x] Add the expanded property definitions to `editable-properties.ts`
- [x] Create `utils/color.ts` — color parsing (hex/rgb/hsl) and conversion
- [x] Create `utils/css-value.ts` — CSS value parsing (extract number + unit)
- [x] Verify type-check, lint, test, build pass

**Blockers:** None

---

## Phase 2.2: Primitive Control Components

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-10
**Completion Date:** 2026-03-10

### Checklist
- [x] Create `controls/NumberInput.tsx`
- [x] Create `controls/SliderInput.tsx`
- [x] Create `controls/ColorInput.tsx`
- [x] Create `controls/SelectInput.tsx`
- [x] Create `controls/SegmentedControl.tsx`
- [x] Create `controls/ToggleSwitch.tsx`
- [x] Create `controls/PerSideControl.tsx`
- [x] Add the new control styling to `styles.ts` (module split deferred)
- [x] Verify type-check, lint, test, build pass

**Blockers:** Depends on Phase 2.1 (type system)

---

## Phase 2.3: Collapsible Sections & Panel Refactor

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-10
**Completion Date:** 2026-03-10

### Checklist
- [x] Create `sections/CollapsibleSection.tsx` — wrapper with chevron toggle, title, optional action
- [x] Refactor `PropertiesPanel.tsx` to use `renderControl()` dispatcher
- [x] Refactor group rendering to use `CollapsibleSection` wrappers
- [x] Add default-expanded behavior for high-priority groups
- [x] Verify type-check, lint, test, build pass

**Blockers:** Depends on Phase 2.2 (controls)

---

## Phase 2.4: High-Priority Sections (Milestone 1)

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-10
**Completion Date:** 2026-03-10

### Checklist
- [x] Spacing section: convert to 2 `PerSideControl` instances (padding + margin)
- [x] Fill/Appearance section: `ColorInput` for bg/text, opacity slider, corner radius per-side
- [x] Typography section: font-family preset select, letter-spacing, text-align segmented, text-decoration, text-transform
- [x] Size section: width/height with unit selectors, min/max constraints
- [x] Layout section: combined display, position type, overflow, z-index controls
- [x] Add shared property-card wrapping for custom sections and fallback controls
- [x] Fix draft updates so multi-property compound edits merge correctly
- [x] Verify type-check, lint, test, build pass

**Blockers:** Depends on Phase 2.3 (sections)

---

## Phase 2.5: Advanced Sections (Milestone 2)

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-10
**Completion Date:** 2026-03-10

### Checklist
- [x] Stroke/Border section: color picker, border-style select, width per-side
- [x] Effects section: box-shadow editor (x/y/blur/spread/color/inset) plus filter fields
- [x] Position section: position type, top/right/bottom/left, z-index
- [x] Auto Layout section: flex direction, wrap, gap, row/column gap, and alignment controls
- [x] Add stable segmented/toggle control IDs for the new test surface
- [x] Verify type-check, lint, test, build pass

**Blockers:** Depends on Phase 2.4 (high-priority sections)

---

## Phase 2.6: Panel Polish

**Status:** COMPLETE (100%)
**Start Date:** 2026-03-12
**Completion Date:** 2026-03-12

### Checklist
- [x] Section dividers and visual hierarchy
- [x] Property search bar at top of panel
- [x] Keyboard navigation (tab through controls, arrow keys in segmented/grid)
- [x] Panel resize handle
- [x] Verify type-check, lint, test, build pass

**Blockers:** None

**Next Phase Gate:** Phase 3 may begin immediately.

---

## Phase 3: Designer-Friendly Editor + Code Writers + Save-to-Branch

**Status:** IN PROGRESS (67%)
**Start Date:** 2026-03-12

### Overview
Delivers a focused designer-friendly property panel with Figma-style sections, smart style detection (Tailwind vs inline), detach-from-classes feature, AST-based code mutation, and save-to-branch workflow.

### Parallelism Map
```
Phase 3.1 (UI) ──────────────────────┐
Phase 3.2 (Style Analyzer) ──────────┤──→ Phase 3.4 (Writer) ──→ Phase 3.6 (Save)
Phase 3.3 (Tailwind Map) ────────────┘         │
                                               ↓
                              Phase 3.5 (Detach) ← depends on 3.1 + 3.4
```

**Blockers:** None

---

## Phase 3.1: Focused Property Subset with Figma-Style Sections

**Status:** COMPLETE (100%)
**Completion Date:** 2026-03-12
**Depends on:** None (pure UI, zero risk — can run in parallel with 3.2 and 3.3)

### Checklist
- [x] Add `FocusedGroupId` type to `packages/client/src/types.ts`: `'layout' | 'fill' | 'typography' | 'design' | 'effects'`
- [x] Add `FOCUSED_PROPERTY_IDS` set to `packages/client/src/editable-properties.ts`
- [x] Add `focusedGroupOrder`, `focusedGroupLabels`, `focusedGroupMembers` mappings to `packages/client/src/editable-properties.ts`
- [x] Refactor `packages/client/src/PropertiesPanel.tsx` into a focused-only rendering path
- [x] Remove search and full-list UI exposure from the panel surface
- [x] Verify type-check, lint, test, build pass

### Finalized Property Set (15 properties, 5 Figma-style groups)

| Section      | Properties | Count |
|-------------|-----------|-------|
| Layout      | paddingTop, paddingRight, paddingBottom, paddingLeft, marginTop, marginRight, marginBottom, marginLeft | 8 |
| Fill        | backgroundColor, color (text color) | 2 |
| Typography  | fontSize, fontWeight, textAlign | 3 |
| Design      | borderRadius | 1 |
| Effects     | boxShadow | 1 |

### Section Rationale (Figma mental model)
- **Layout** — Spatial adjustments: "how much breathing room does this element have?"
- **Fill** — Background + text color (matches Figma's Fill section for text layers)
- **Typography** — Font presentation: size, weight, alignment
- **Design** — Shape refinement: corner radius
- **Effects** — Shadows and visual depth

### Key Files
- `packages/client/src/types.ts` — add FocusedGroupId type
- `packages/client/src/editable-properties.ts` — add focused sets and mappings
- `packages/client/src/PropertiesPanel.tsx` — render the focused-only 15-property surface

**No changes to:** `drafts.ts` (snapshot/restore works with all properties regardless of UI filter)

---

## Phase 3.2: Style Strategy Detection

**Status:** COMPLETE (100%)
**Completion Date:** 2026-03-12
**Depends on:** None (can run in parallel with 3.1 and 3.3)

### Checklist
- [x] Extend `StyleMode` in `packages/client/src/types.ts` to `'inline' | 'tailwind' | 'mixed' | 'detached' | 'unknown'`
- [x] Create `packages/vite-plugin/src/style-analyzer.ts` — uses ts-morph to parse source file, find JSX element at line:column, inspect className and style attributes
- [x] Returns `{ mode: StyleMode, classNames: string[], inlineStyles: Record<string, string> }`
- [x] Add `hawk-eye:analyze-style` WS event to `packages/vite-plugin/src/ws-server.ts`
- [x] Add `requestStyleAnalysis(source)` to `packages/client/src/ws-client.ts`
- [x] On element selection in `packages/client/src/DesignTool.tsx`, request server-side style analysis
- [x] Store analyzed style metadata on the `SelectionDraft`
- [x] Verify type-check, lint, test, build pass

### Key Implementation Notes
- For className: tokenize string literals, match tokens against known Tailwind patterns (prefix table: `p-`, `m-`, `bg-`, `text-`, `flex-`, `rounded-`, etc.)
- For dynamic className expressions (cn(), clsx(), ternaries): report as `'unknown'` — only process string literals
- Cache style analysis results per source token to avoid repeated file reads

### Key Files
- `packages/client/src/types.ts` — extend StyleMode
- `packages/vite-plugin/src/style-analyzer.ts` — NEW
- `packages/vite-plugin/src/ws-server.ts` — add WS event
- `packages/client/src/ws-client.ts` — add request function
- `packages/client/src/DesignTool.tsx` — integrate style analysis on selection

---

## Phase 3.3: Tailwind CSS-to-Class Mapping

**Status:** COMPLETE (100%)
**Completion Date:** 2026-03-12
**Depends on:** None (standalone, can run in parallel with 3.1 and 3.2)

### Checklist
- [x] Create `packages/vite-plugin/src/tailwind-map.ts`
- [x] Implement `cssToTailwindClass(cssProperty: string, value: string): string | null`
- [x] Implement `tailwindClassToCss(className: string): { property: string, value: string } | null`
- [x] Cover the focused 15 properties: padding (`pt`/`pr`/`pb`/`pl`), margin (`mt`/`mr`/`mb`/`ml`), `bg-{color}`, `text-{color}`, `text-{size}`, `font-{weight}`, `text-{align}`, `rounded-{size}`, `shadow-{size}`
- [x] Support arbitrary value syntax for non-standard values: `p-[14px]`, `bg-[#hex]`, `rounded-[13px]`
- [x] Add comprehensive unit tests for roundtrip conversions
- [x] Verify type-check, lint, test, build pass

### Key Implementation Notes
- Pure data + functions, no side effects — highly testable
- Use Tailwind's default spacing scale: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
- Map spacing values to rem: 1 unit = 0.25rem = 4px
- For colors: reverse-resolve against Tailwind default palette, fall back to arbitrary `bg-[#hex]`
- The `tailwindPrefix` field on property definitions in `editable-properties.ts` provides the prefix for each property

### Key Files
- `packages/vite-plugin/src/tailwind-map.ts` — NEW
- `packages/client/src/editable-properties.ts` — reference for `tailwindPrefix` values

---

## Phase 3.4: AST Mutation Writer (ts-morph)

**Status:** COMPLETE (100%)
**Completion Date:** 2026-03-12
**Depends on:** Phase 3.2 (style analyzer) + Phase 3.3 (tailwind map)

### Checklist
- [x] Create `packages/vite-plugin/src/mutations.ts` — TypeScript types for mutation payloads
- [x] Create `packages/vite-plugin/src/source-writer.ts` — the core mutation engine
- [x] Implement `findJsxElementAtPosition(sourceFile, line, column)` utility with coordinate conversion (Babel 1-indexed line:col → ts-morph positions)
- [x] Implement Tailwind class swapping: find existing class in className string, replace with new class from tailwind-map
- [x] Implement inline style writing: find or create `style` JSX attribute, add/update property in style object
- [x] Implement detached mode: remove `className` entirely, write all properties as inline style
- [x] Implement mixed mode: Tailwind swaps where classes exist, inline for the rest
- [x] Handle string literal className only — fall back to inline styles with warning for dynamic expressions
- [x] Add unit tests writing to temp files — verify formatting preservation
- [x] Verify type-check, lint, test, build pass

### Mutation Types
```typescript
interface PropertyMutation {
  propertyId: string;
  cssProperty: string;
  oldValue: string;
  newValue: string;
}

interface ElementMutation {
  file: string;
  line: number;
  column: number;
  styleMode: StyleMode;
  detached: boolean;
  properties: PropertyMutation[];
}

interface SavePayload {
  mutations: ElementMutation[];
}
```

### Key Risks
- Babel injects `data-source` with 1-indexed line:column. ts-morph uses 1-indexed lines but internally works with 0-indexed character positions. Build and thoroughly test `findJsxElementAtPosition()`.
- When the same JSX node has multiple runtime instances (e.g., inside `.map()`), changes are written once to the source template. Warn the user that changes affect all instances.
- Dynamic `className` and non-object-literal `style` expressions are intentionally not rewritten structurally yet; the writer warns and falls back or skips inline writes.

### Key Files
- `packages/vite-plugin/src/mutations.ts` — NEW
- `packages/vite-plugin/src/source-writer.ts` — NEW
- `packages/vite-plugin/src/style-analyzer.ts` — from Phase 3.2
- `packages/vite-plugin/src/tailwind-map.ts` — from Phase 3.3
- `packages/vite-plugin/src/source-injector.ts` — reference for how Babel computes line:column tokens

---

## Phase 3.5: Detach Toggle

**Status:** NOT STARTED
**Depends on:** Phase 3.1 (focused property IDs) — preview works standalone; Phase 3.4 (writer) for save behavior

### Checklist
- [ ] Add `detached: boolean` to `SelectionDraft` in `packages/client/src/types.ts`
- [ ] Add `detachDraft(draft, element)` function to `packages/client/src/drafts.ts` — reads `getComputedStyle` for all focused properties, populates draft values, marks as dirty, sets `detached = true`
- [ ] Add "Detach from classes" button to `packages/client/src/Inspector.tsx` (visible when `styleMode === 'tailwind'` or `'mixed'`)
- [ ] Add `handleDetach(instanceKey)` callback in `packages/client/src/DesignTool.tsx`
- [ ] Apply inline styles immediately for live preview after detach (existing `applyDraftToElement` handles this)
- [ ] Verify type-check, lint, test, build pass

### Behavior
- When user clicks "Detach", `detachDraft` iterates the focused 15 properties, reads `getComputedStyle` for each, and writes them as draft values (making them dirty)
- The draft's `styleMode` changes to `'detached'`
- On save, the writer removes `className` attribute entirely and writes all properties as inline `style`
- Like Figma's "detach instance" — a clean break from the class system

### Key Files
- `packages/client/src/types.ts` — add `detached` flag
- `packages/client/src/drafts.ts` — add `detachDraft()` function
- `packages/client/src/Inspector.tsx` — add detach button
- `packages/client/src/DesignTool.tsx` — add detach handler
- `packages/client/src/editable-properties.ts` — reference for `FOCUSED_PROPERTY_IDS`

---

## Phase 3.6: Save-to-Branch Workflow

**Status:** NOT STARTED
**Depends on:** Phase 3.4 (source writer)

### Checklist
- [ ] Create `packages/vite-plugin/src/git-ops.ts` — `getCurrentBranch`, `hasUncommittedChanges`, `createBranch`, `commitChanges`, `restoreOriginalBranch`
- [ ] Create `packages/vite-plugin/src/save-handler.ts` — WS handler for `hawk-eye:save` event
- [ ] Register save handler in `packages/vite-plugin/src/index.ts` `configureServer`
- [ ] Add `requestSave(payload)` + `onSaveResult(cb)` to `packages/client/src/ws-client.ts`
- [ ] Add "Save to branch" button to `packages/client/src/Inspector.tsx` (visible when dirty drafts exist)
- [ ] Add `handleSave()` to `packages/client/src/DesignTool.tsx` — collects dirty drafts into `SavePayload`
- [ ] After save succeeds, clear all drafts
- [ ] Show save result to user (branch name, commit SHA, or error)
- [ ] Verify type-check, lint, test, build pass

### Save Flow
1. Check for uncommitted changes (abort with error if working tree is dirty)
2. Get current branch name
3. Create new branch: `hawk-eye/design-tweaks-{YYYYMMDD-HHmmss}`
4. Run source-writer to mutate files
5. Stage and commit modified files
6. Switch back to original branch
7. Send result to client: `{ success, branch, commitSha, error? }`

### Key Files
- `packages/vite-plugin/src/git-ops.ts` — NEW
- `packages/vite-plugin/src/save-handler.ts` — NEW
- `packages/vite-plugin/src/index.ts` — register handler
- `packages/client/src/ws-client.ts` — add save events
- `packages/client/src/Inspector.tsx` — add save button
- `packages/client/src/DesignTool.tsx` — add save handler

---

## Phase 4: Polish, Docs & Public Release

**Status:** NOT STARTED

### Key Deliverables
1. Edge-case handling
2. Error boundaries and fallbacks
3. Complete documentation
4. Demo refinement
5. Open-source release prep

### v0.7: Zero-Config CLI
- Auto-detect framework, build tool, styling
- One-command setup

### v0.8: Multi-Framework
- Vue 3 support
- Svelte support

### v1.0: Full Design Tool Parity
- Text editing on canvas
- Image replacement
- Animation/transition editing
- Multi-select
- Design tokens export

---

Current: 2026-03-12 (Phase 2.6 complete, Phase 3 in progress)
