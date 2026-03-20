# Hawk-Eye

Pre-alpha visual inspector and live-preview editor for React + Vite interfaces.

> Use AI to generate UI. Use Hawk-Eye to inspect and refine it.

## Current Status

As of 2026-03-18, this repository has completed the prerelease hardening pass:

- The workspace now publishes one installable package, `hawk-eye`, with `.` and `./vite` entrypoints.
- `DesignTool` renders a floating inspector trigger and Shadow DOM overlay in development.
- The Vite plugin injects signed `data-hawk-eye-source` metadata onto intrinsic JSX elements during dev transforms.
- Clicking a live DOM element locks selection, reveals repo-relative source metadata, and opens a properties panel.
- The properties panel now exposes a focused 15-property editor grouped into Layout, Fill, Typography, Design, and Effects.
- The inspector now requests server-side AST analysis to classify selections as inline, tailwind, mixed, or unknown.
- The Vite plugin now includes focused-property Tailwind CSS/class mapping utilities and a ts-morph AST writer for source mutations.
- Tailwind and mixed selections can now be detached into focused inline preview styles from the inspector.
- Dirty drafts can be written directly back to source from the inspector's `Update Design` action when writes are explicitly enabled in `hawkeyePlugin({ enableSave: true })`.
- Preview changes stay in the current browser session, survive switching between selected elements, and can be reset per field or all at once.

This repo is not published to npm yet. The current entrypoint for evaluation is the local demo app.

## Quick Start

```bash
pnpm install
pnpm dev
```

Install the public package in an app:

```bash
pnpm add hawk-eye
```

Use the public entrypoints:

```ts
import { DesignTool } from 'hawk-eye';
import hawkeyePlugin from 'hawk-eye/vite';
```

Additional verification commands:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

## What Works Today

- Workspace install and local package linking
- Library builds for `hawk-eye` and its internal client/plugin packages
- Demo app startup and production build
- Dev-only inspector trigger, hover outline, click-to-lock selection, and repo-relative source info
- Guided focused controls for layout spacing, fill, typography, radius, and box shadow
- AST-backed style strategy detection over the Vite HMR channel
- Tailwind CSS-to-class mapping utilities for the focused property set
- AST source mutation primitives for Tailwind swaps, inline style writes, mixed-mode fallback, and detached writes
- A detach-from-classes preview flow that keeps focused properties inline and marks the draft as `detached`
- An explicit `Update Design` source-write workflow with AST-backed edits and inspector feedback when enabled
- DOM-only live preview with session-scoped pending changes, per-field reset, and global reset
- Automated coverage for source injection, HMR payload validation, and the client runtime

## What Does Not Work Yet

- Dynamic `className` and dynamic `style` expressions still fall back or warn instead of being rewritten structurally
- No built-in diff or review surface yet for live source writes

Those are the main remaining limitations before broader polish.

## Agent Memory

- `AGENTS.md` is the repo entrypoint for agent instructions.
- Canonical shared memory lives in `.memory/`.
- No bootstrap command is required for day-to-day memory handling.
- Agents can work directly with `.memory/sessions/`, `.memory/notes/`, `.memory/attachments/`, and `.memory/receipts.jsonl`.
- `pnpm memory:migrate` and `pnpm memory:doctor` remain available as optional helper tooling.
- `.agents/` remains in the repo only as legacy migration input.

## Repository Layout

```text
hawk-eye/
├── AGENTS.md           # Agent entrypoint and memory workflow
├── CLAUDE.md           # Claude bridge into AGENTS.md
├── CODEX.md            # Codex bridge into AGENTS.md
├── GEMINI.md           # Gemini bridge into AGENTS.md
├── .memory/            # Canonical repo memory contract
├── packages/
│   ├── client/        # Internal React runtime package
│   ├── vite-plugin/   # Internal Vite integration package
│   └── hawk-eye/      # Public package export surface
├── demo/              # Local React + Tailwind demo app
├── docs/              # Architecture notes
├── tests/             # Vitest coverage
└── .agents/           # Legacy migration input for older handoff files
```

## Roadmap

1. Phase 4: Hardening, documentation, and release prep
2. Future: broader framework support and deeper design-tool parity

Detailed status lives in [`.memory/PHASE_STATUS.md`](./.memory/PHASE_STATUS.md).

## Resources

- [Specification](./spec.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Agent Instructions](./AGENTS.md)
- [Current Context](./.memory/CURRENT_CONTEXT.md)
- [Decisions Log](./.memory/DECISIONS.md)

## License

MIT. See [LICENSE](./LICENSE).
