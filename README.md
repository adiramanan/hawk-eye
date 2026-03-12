# Hawk-Eye

Pre-alpha visual inspector and live-preview editor for React + Vite interfaces.

> Use AI to generate UI. Use Hawk-Eye to inspect and refine it.

## Current Status

As of 2026-03-12, this repository has completed Phases 3.1, 3.2, 3.3, and 3.4 and is in progress on the rest of Phase 3:

- The pnpm workspace, TypeScript config, linting, builds, and demo app are wired up.
- `@hawk-eye/client` renders a floating inspector trigger and Shadow DOM overlay in development.
- `@hawk-eye/vite-plugin` injects `data-source="file:line:column"` onto intrinsic JSX elements during Vite dev transforms.
- Clicking a live DOM element locks selection, reveals repo-relative source metadata, and opens a properties panel.
- The properties panel now exposes a focused 15-property editor grouped into Layout, Fill, Typography, Design, and Effects.
- The inspector now requests server-side AST analysis to classify selections as inline, tailwind, mixed, or unknown.
- The Vite plugin now includes focused-property Tailwind CSS/class mapping utilities and a ts-morph AST writer for source mutations.
- Preview changes stay in the current browser session, survive switching between selected elements, and can be reset per field or all at once.

This repo is not published to npm yet. The current entrypoint for evaluation is the local demo app.

## Quick Start

```bash
pnpm install
pnpm dev
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
- Library builds for `@hawk-eye/client` and `@hawk-eye/vite-plugin`
- Demo app startup and production build
- Dev-only inspector trigger, hover outline, click-to-lock selection, and repo-relative source info
- Guided focused controls for layout spacing, fill, typography, radius, and box shadow
- AST-backed style strategy detection over the Vite HMR channel
- Tailwind CSS-to-class mapping utilities for the focused property set
- AST source mutation primitives for Tailwind swaps, inline style writes, mixed-mode fallback, and detached writes
- DOM-only live preview with session-scoped pending changes, per-field reset, and global reset
- Automated coverage for source injection, HMR payload validation, and the client runtime

## What Does Not Work Yet

- Detach and save-to-branch workflows
- A user-facing save flow that sends draft mutations through the writer
- Dynamic `className` and dynamic `style` expressions still fall back or warn instead of being rewritten structurally

Those capabilities are the remaining Phase 3 work.

## Repository Layout

```text
hawk-eye/
├── packages/
│   ├── client/        # Embeddable React component
│   └── vite-plugin/   # Vite integration
├── demo/              # Local React + Tailwind demo app
├── docs/              # Architecture notes
├── tests/             # Vitest coverage
└── .agents/           # Multi-agent handoff state
```

## Roadmap

1. Phase 3: Code mutation and file persistence
2. Phase 4: Hardening, documentation, and release prep

Detailed status lives in [`.agents/PHASE_STATUS.md`](./.agents/PHASE_STATUS.md).

## Resources

- [Specification](./spec.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Current Context](./.agents/CURRENT_CONTEXT.md)
- [Decisions Log](./.agents/DECISIONS.md)

## License

MIT. See [LICENSE](./LICENSE).
