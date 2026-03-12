# Current Session Context

## Last Agent
Claude Code (Opus 4.6)

## Last Session
2026-03-12 - Phase 3 planning and .agents/ update

## Current Status
**Phase:** 3 (Designer-Friendly Editor + Code Writers + Save-to-Branch) - IN PROGRESS

Phases 0–2.6 are COMPLETE. The inspector has a full property editor with 60+ CSS properties, live DOM preview, search, keyboard navigation, and resizable panel.

### What was completed (Phase 3 planning):

- Refined the tool concept: focused designer-friendly property panel for quick polish without AI
- Finalized the focused property set: 15 properties in 5 Figma-style groups
- Designed the save-to-branch workflow: creates git branch, writes mutations, commits, switches back
- Designed the detach-from-classes feature: like Figma's "detach instance"
- Wrote Phase 3.1–3.6 sub-phases with full checklists into PHASE_STATUS.md

## Next Steps

### Immediate (can run in parallel):
1. **Phase 3.1**: Focused Property Subset with Figma-Style Sections (pure UI)
2. **Phase 3.2**: Style Strategy Detection (server + client)
3. **Phase 3.3**: Tailwind CSS-to-Class Mapping (standalone, testable)

### After 3.1–3.3 complete:
4. **Phase 3.4**: AST Mutation Writer (depends on 3.2 + 3.3)

### After 3.4 complete:
5. **Phase 3.5**: Detach Toggle (depends on 3.1 + 3.4)
6. **Phase 3.6**: Save-to-Branch Workflow (depends on 3.4)

## Execution Order
```
[DONE] Phase 0 → [DONE] 1 → [DONE] 2 → [DONE] 2.1–2.6 → 3.1 + 3.2 + 3.3 (parallel) → 3.4 → 3.5 + 3.6
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
- The `findJsxElementAtPosition()` utility in `source-writer.ts` must carefully handle this conversion
- Write thorough tests for this utility

### Testing
- Run `pnpm type-check && pnpm lint && pnpm test && pnpm build` after each sub-phase
- Tests use `data-hawk-eye-control` selectors for inputs, selects, segmented buttons, etc.
- jsdom tests for client-side, regular Node tests for vite-plugin
