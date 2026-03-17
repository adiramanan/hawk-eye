# Current Session Context

## Last Agent
Codex (GPT-5)

## Last Session
2026-03-17 - Phase 3.10 Size & Spacing refinement + handoff doc sync

## Current Status
**Phase:** 3.10 (Size & Spacing Section) - COMPLETE
**Next:** 3.8 (Context-Aware Panel)

Phases 0–3.6 complete, UI-refinement pass complete (Figma parity), Phase 3.9 complete (all 6 MVP sections visible with all focused properties), and Phase 3.10 is now complete with the follow-up refinement pass finished. Width/height support `fixed | hug | fill | relative`, size-mode semantics persist across save/reload, aspect ratio lock is implemented, the panel width is fixed to the Figma layout, and px-only controls no longer render misleading dropdown affordances. Phase 3.8 (context-aware section visibility) remains the next planned implementation. See PHASE_STATUS.md for broader phase history.

### Immediate Next Steps
1. **Phase 3.8** — Context-aware panel: conditionally hide Typography for non-text elements; compute ElementContext on selection. See PHASE_STATUS.md → "Phase 3.8" and DECISIONS.md → D20. Pure client-side, ~4 files. (~2-3 hours)
2. **D14 debt** — Split `styles.ts` (~1750 lines) into `styles/base.ts`, `styles/controls.ts`, `styles/sections.ts`, `styles/index.ts` (~1-2 hours)
3. **Handoff doc consistency** — `PHASE_STATUS.md` still describes the pre-refinement Phase 3.10 implementation and should be synced if more handoff-doc work is done
4. **Phase 4** — Edge cases, error boundaries, release docs, demo refinement

---

## Execution Order
```
[DONE] Phase 0 → [DONE] 1 → [DONE] 2 → [DONE] 2.1–2.6 → [DONE] 3.1 → [DONE] 3.2 → [DONE] 3.3 → [DONE] 3.4 → [DONE] 3.5 → [DONE] 3.6 → [DONE] UI Refinement → [DONE] 3.9 → [DONE] 3.10 (Size & Spacing + refinement) → [ ] 3.8 (Context-Aware) → 4
```

---

## Known Blockers
None.

---

## Technical Debt to Address in Phase 4

### D14 — styles.ts module split (OVERDUE)
`styles.ts` is ~1750 lines. Decision D14 calls for splitting into:
- `styles/base.ts` — CSS variables, reset, root layout
- `styles/controls.ts` — all control-level CSS (inputs, selects, color picker, per-side, etc.)
- `styles/sections.ts` — panel, sections, footer, drag header
- `styles/index.ts` — concatenates and re-exports `hawkEyeStyles`

The combined export contract (`hawkEyeStyles`) must not change.

---

## Notes for Next Agent

### Architecture Context
- Read `DECISIONS.md` D17-D19 for the Phase 3 architectural decisions
- Read `DECISIONS.md` D21 for the refined size-control semantics
- Read `PHASE_STATUS.md` Phase 3.1–3.6 + "UI Refinement" for detailed checklists and key files
- The property definitions array in `editable-properties.ts` is the single source of truth — the `tailwindPrefix` field is used by the Tailwind map and writer
- ts-morph is already a dependency in `@hawk-eye/vite-plugin/package.json`
- The `diff` package is also already a dependency

### Key Patterns
- All new server-side modules go in `packages/vite-plugin/src/`
- All new client-side changes go in existing files under `packages/client/src/`
- All Hawk-Eye UI renders inside Shadow DOM — use `data-hawk-eye-ui` and `data-hawk-eye-control` attributes
- No external CSS frameworks or component libraries — all custom
- **Styles:** currently one file `styles.ts` (~1750 lines) — D14 split is pending for Phase 4
- CSS attribute selectors on `data-hawk-eye-ui` use **exact-match** `[attr="val"]` — never put multiple tokens in a single `data-hawk-eye-ui` attribute
- Draft system keys by `instanceKey` (format: `source@@occurrence`), not just `source`
- Use functional draft updates for multi-property edits (pattern from Phase 2.4)
- WebSocket events follow the pattern `hawk-eye:{event-name}` — see `ws-server.ts` and `ws-client.ts`
- The panel is focused-only: 3 sections (Appearance, Typography, Border) — no search bar, no full-property toggle
- `SelectionDraft` carries: `classNames`, `inlineStyles` (from server), `detached` flag
- `SelectionDraft.sizeControl` now carries per-axis mode snapshots, per-axis numeric memory, and `aspectRatio` / `aspectRatioLocked`
- Detached drafts are pending even when property values equal their computed baseline
- `tailwind-map.ts` is intentionally pure and side-effect free
- `source-writer.ts` remains server-only; `save-handler.ts` wraps it with git operations
- `size-state.ts` is the client-side source of truth for size-mode inference, numeric memory seeding, and persisted size-mode CSS custom property names
- Persisted size-mode metadata is written as inline custom properties and explicitly ignored by style analysis so Tailwind elements do not become `mixed`

### Current Panel Sections (as of 2026-03-17, after Phase 3.10)
| Section    | Properties shown | Notes |
|------------|-----------------|-------|
| Size & Spacing (combined) | **Size:** W/H pill controls with `Fixed/Hug/Fill/Relative` mode menu, numeric field for Fixed/Relative, aspect-ratio-lock btn; **Corner Radius:** All/Each toggle, value(s); **Position:** type, X, Y; **Spacing:** Padding (per-side), Margin (per-side) | Merged Frame + Spacing sections; panel width is fixed to 320px; only the chevron opens the size-mode menu; Fixed is always `px`, Relative is always `%`; aspect ratio lock is functional for numeric modes and uses the field values at lock time |
| Layout (Auto Layout) | None/Stack/Grid mode selector; for Stack: Direction, Justify, Align, Wrap, Gap, [Grow, Shrink, Basis]; for Grid: Columns, Rows, Column Gap, Row Gap, Auto flow, [Column Span, Row Span] | Item properties (bracketed) shown when layout mode is flex/grid |
| Appearance | Fill Colour (full width), then Opacity \| Corner Radius (2-col) | Opacity unit dropdown hidden; radius controls are `px`-only with static unit labels |
| Typography | Font family (full), Text Colour, Weight \| Size, Line height \| Letter spacing, Alignment | Text Colour visible |
| Border     | Type first; when solid → auto-sets 1px width; when none → hides all stroke fields; Dash/Gap only for dashed; no dotted | Stroke-width controls are `px`-only with static unit labels |

### Critical Patterns Learned (2026-03-16 + 3.10)
- `backdrop-filter` on an ancestor breaks `position: fixed` children — use `::before` pseudo-element instead
- `PerSideControl` now uses `[All/Each <select>][value pill]` layout — inputs strip unit for display, re-append on change
- `color-row` is the styled container; inner `text-input` is transparent/borderless
- `input-unit-label` is a new reusable CSS token for static unit suffixes
- **Phase 3.10 refinement:** Width/height now use explicit size-mode metadata because raw CSS alone cannot distinguish `relative 100%` from `fill 100%`
- **Phase 3.10 refinement:** `fit-content` maps to Hug, `100%` maps to Fill only when metadata is absent, and Relative/Fixed preserve separate per-axis numeric memory
- **Phase 3.10 refinement:** Custom size-mode menus are stable once the document-level capture click handler ignores Hawk-Eye panel clicks
- **Phase 3.10 refinement:** Aspect ratio lock must use the numeric field values at lock time, not the rendered DOM box from `getBoundingClientRect()`
- **Phase 3.10 refinement:** Single-unit controls should not render a dropdown chevron; show static unit labels instead

### Focused Property Set (as expanded during UI refinement)
| Section      | Properties | Count |
|-------------|-----------|-------|
| Appearance  | backgroundColor, opacity, borderRadius, borderTopLeftRadius, borderTopRightRadius, borderBottomRightRadius, borderBottomLeftRadius | 7 |
| Typography  | fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign | 6 |
| Border      | borderStyle, borderColor, strokeDasharray, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth | 7 |

### Critical Risk: Position Coordinate Matching
- Babel injects `data-source` with 1-indexed line:column (see `source-injector.ts`)
- ts-morph uses 1-indexed lines but 0-indexed character positions internally
- The `findJsxElementAtPosition()` utility in `source-writer.ts` is covered by targeted temp-file tests
- Dynamic `className` and dynamic `style` expressions are still the main unresolved writer/save edge cases

### Testing
- Run `pnpm type-check && pnpm lint && pnpm test && pnpm build` after each sub-phase
- Tests use `data-hawk-eye-control` selectors for inputs, selects, segmented buttons, etc.
- jsdom tests for client-side, regular Node tests for vite-plugin
- Phase 3.10 refinement is now covered by jsdom tests for mode switching, persisted numeric memory, mode-only dirty state, custom size-menu interactions, and aspect-ratio lock behavior

### Phase 3.10 Status & Known Issues
- **Implementation state:** refined and shipped for current scope
- **SizeInput component:** custom pill control with a single chevron-driven mode menu; Fixed is `px`, Relative is `%`, Hug/Fill are token states
- **Aspect ratio lock button:** functional for numeric modes; preserves the ratio from the field values at the moment the lock is enabled
- **Panel layout:** width fixed to the 320px Figma spec; size controls cannot stretch the inspector
- **Unit policy:** radius, padding, margin, and stroke-width controls are `px`-only and render static `px` labels with no dropdown
