# Current Session Context

## Last Agent
- Codex

## Last Session
- 2026-03-22T20:35:23.000Z (20260322T200824000Z--codex)

## Current Status
- The latest session reproduced the Apply failure in the live demo and traced it to Vite plugin order: `react()` was running before `hawkeyePlugin()`, so Hawk-Eye stamped DOM nodes with React-refresh-shifted source coordinates and writes targeted the wrong JSX location.
- `demo/vite.config.ts` now mounts `hawkeyePlugin({ enableSave: true })` before `react()`, and the live browser check confirmed the `Release readiness frame` heading now carries the correct `src/App.tsx:258:21` source token instead of the broken `src/App.tsx:277:21` value.
- `packages/hawk-eye/src/installer.ts`, `packages/hawk-eye/README.md`, `tests/installer.test.ts`, and `tests/smoke.test.ts` now encode and verify the required plugin order, and `packages/vite-plugin/src/index.ts` warns when a manual config puts React transforms ahead of Hawk-Eye.

## Next Steps
- If broader live verification is needed, replay a few more real Apply flows across non-text specimens now that token injection is aligned with the original TSX coordinates.
- The unrelated Layers-tab work in `packages/client/src/Inspector.tsx`, `packages/client/src/styles.ts`, and `tests/design-tool.test.ts` is still present in the worktree and was not modified in this session.

## Touched Areas
- demo/vite.config.ts
- packages/hawk-eye/src/installer.ts
- packages/hawk-eye/README.md
- packages/vite-plugin/src/index.ts
- tests/installer.test.ts
- tests/smoke.test.ts
- .memory/sessions/20260322T200824000Z--codex.md
- .memory/CURRENT_CONTEXT.md
- .memory/receipts.jsonl
