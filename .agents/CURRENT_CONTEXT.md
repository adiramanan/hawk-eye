# Current Session Context

## Last Agent
Codex (GPT-5)

## Last Session
2026-03-12 - Phase 3.6 save-to-branch implementation

## Current Status
**Phase:** 4 (Polish, Docs & Public Release) - NOT STARTED

Phases 0–3.6 are COMPLETE. The inspector now opens a focused-only 15-property editor with Figma-style sections, live DOM preview, keyboard navigation, a resizable panel, server-backed style strategy detection, a pure Tailwind CSS/class mapping layer, a ts-morph AST writer for source mutations, a detach-from-classes preview flow, and a git-backed save-to-branch workflow.

### What was completed:

- Implemented `FocusedGroupId` plus focused property metadata in `editable-properties.ts`
- Replaced the old search/full-list panel surface with a focused-only 5-section editor:
  Layout, Fill, Typography, Design, Effects
- Added server-side AST style analysis with a new HMR event path:
  request `hawk-eye:analyze-style`, response `hawk-eye:style-analysis`
- Added ts-morph analysis for Tailwind vs inline vs mixed vs unknown, plus cached payload resolution in `ws-server.ts`
- Updated client drafts to store analyzed `styleMode`, `classNames`, and `inlineStyles`
- Added `tailwind-map.ts` with focused-property conversions in both directions:
  `cssToTailwindClass()` and `tailwindClassToCss()`
- Added `mutations.ts` and `source-writer.ts` in the Vite plugin:
  `writeSourceMutations()` now performs AST-based class swaps, inline style upserts, detached writes, and mixed-mode fallback by file/line/column
- Added writer warnings for unsupported dynamic `className` and dynamic `style` expressions instead of attempting unsafe rewrites
- Added `detached: boolean` to `SelectionDraft` plus `detachDraft()` in `drafts.ts`
- Added a detach action in the inspector for `tailwind` and `mixed` selections, along with detached-state status copy in the panel
- Updated draft application and dirty-state logic so detached drafts stay pending and keep focused properties inline during preview
- Preserved detached mode when later style-analysis events arrive for the same source token
- Added save payload/result types and new HMR events for `hawk-eye:save` and `hawk-eye:save-result`
- Added git-root-aware save handling in the Vite plugin: dirty-worktree guard, review-branch creation, AST mutation write, commit, and restore-original-branch behavior
- Added a save action plus save-result feedback in the inspector, and cleared session previews automatically after successful saves
- Added temp git repo coverage for save-to-branch and client-side coverage for save request/result handling
- Added roundtrip-heavy unit coverage for spacing, colors, typography, radius, and shadow utilities
- Added temp-file mutation coverage for coordinate matching, Tailwind rewriting, inline object updates, mixed mode, detached mode, and warning paths
- Kept the broader property/draft infrastructure intact under the hood
- Rewrote jsdom coverage to assert the focused panel surface, the new style-analysis request, and async badge hydration
- Added Node-side tests for the style analyzer and the server analysis handler
- Verified `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build`

## Next Steps

### Immediate:
1. **Phase 4**: Edge cases, error boundaries, release docs, and demo refinement

## Execution Order
```
[DONE] Phase 0 → [DONE] 1 → [DONE] 2 → [DONE] 2.1–2.6 → [DONE] 3.1 → [DONE] 3.2 → [DONE] 3.3 → [DONE] 3.4 → [DONE] 3.5 → [DONE] 3.6 → 4
```

## Known Blockers
None.

## Notes for Next Agent

### Architecture Context
- Read `DECISIONS.md` D17-D19 for the Phase 3 architectural decisions
- Read `PHASE_STATUS.md` Phase 3.1–3.6 for detailed checklists and key files
- The property definitions array in `editable-properties.ts` is the single source of truth — the `tailwindPrefix` field is used by the Tailwind map and writer
- ts-morph is already a dependency in `@hawk-eye/vite-plugin/package.json` — use it for both style analysis and source writing
- The `diff` package is also already a dependency

### Key Patterns
- All new server-side modules go in `packages/vite-plugin/src/`
- All new client-side changes go in existing files under `packages/client/src/`
- All Hawk-Eye UI renders inside Shadow DOM — use `data-hawk-eye-ui` and `data-hawk-eye-control` attributes
- No external CSS frameworks or component libraries — all custom
- Styles are in a single `styles.ts`
- Draft system keys by `instanceKey` (format: `source@@occurrence`), not just `source`
- Use functional draft updates for multi-property edits (pattern from Phase 2.4)
- WebSocket events follow the pattern `hawk-eye:{event-name}` — see `ws-server.ts` and `ws-client.ts`
- The panel is now focused-only: no search bar, no full-property toggle, no advanced controls in the user-facing UI
- `SelectionDraft` now carries analyzed `classNames` and `inlineStyles` from the server
- `SelectionDraft` now also carries `detached`; detached drafts are pending even when property values equal their computed baseline
- `tailwind-map.ts` is intentionally pure and side-effect free so the writer can call it directly
- `source-writer.ts` remains server-only; `save-handler.ts` wraps it with git operations instead of mixing AST and git concerns

### Focused Property Set (15 properties, 5 Figma-style groups)
| Section      | Properties | Count |
|-------------|-----------|-------|
| Layout      | paddingTop/Right/Bottom/Left, marginTop/Right/Bottom/Left | 8 |
| Fill        | backgroundColor, color | 2 |
| Typography  | fontSize, fontWeight, textAlign | 3 |
| Design      | borderRadius | 1 |
| Effects     | boxShadow | 1 |

### Critical Risk: Position Coordinate Matching
- Babel injects `data-source` with 1-indexed line:column (see `source-injector.ts`)
- ts-morph uses 1-indexed lines but 0-indexed character positions internally
- The `findJsxElementAtPosition()` utility in `source-writer.ts` is now covered by targeted temp-file tests
- Dynamic `className` and dynamic `style` expressions are still the main unresolved writer/save edge cases
- Save-to-branch currently reports only branch/commit/warnings; there is still no in-product diff browser or PR automation

### Testing
- Run `pnpm type-check && pnpm lint && pnpm test && pnpm build` after each sub-phase
- Tests use `data-hawk-eye-control` selectors for inputs, selects, segmented buttons, etc.
- jsdom tests for client-side, regular Node tests for vite-plugin
