# Hawk-Eye Shared Memory

## Project Overview
- Hawk-Eye is a pre-alpha visual inspector and live-preview editor for React + Vite interfaces.
- The public install surface is `hawk-eye` with `.` and `./vite` entrypoints.
- The repo is a pnpm workspace with internal `client` and `vite-plugin` packages plus a local demo app.

## Technical Shape
- Language: TypeScript with strict mode.
- Tooling: pnpm, tsup, Vite, ESLint, Prettier, Vitest.
- Runtime split: browser UI lives in `packages/client`, dev-server integration and source mutation live in `packages/vite-plugin`.

## Memory Protocol
- Canonical shared memory lives under `.memory/`.
- Day-to-day memory handling is file-native and does not require helper commands.
- Session files live in `.memory/sessions/`.
- Durable notes live in `.memory/notes/`.
- Attachments live in `.memory/attachments/`.
- Session lifecycle receipts are appended to `.memory/receipts.jsonl`.
- `AGENTS.md` is the canonical cross-agent protocol document.
- `CLAUDE.md`, `CODEX.md`, and `GEMINI.md` are thin bridge files only.

## Current Product State
- Inspector trigger, selection, live preview, style analysis, detach flow, and save-to-branch flow are implemented.
- Phase 1 (advanced typography) and Phase 2 (transitions) of the property gap roadmap are shipped.
- The next known product milestone is Phase 3 (CSS transforms) — see `.memory/project_property_gap_roadmap.md`.

## Property Gap Roadmap
- Full gap analysis vs paper.design and 8-phase implementation plan: `.memory/project_property_gap_roadmap.md`
