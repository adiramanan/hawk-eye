# Hawk-Eye

Pre-alpha visual inspector for React + Vite interfaces.

> Use AI to generate UI. Use Hawk-Eye to inspect and refine it.

## Current Status

As of 2026-03-08, this repository has completed Phase 1:

- The pnpm workspace, TypeScript config, linting, builds, and demo app are wired up.
- `@hawk-eye/client` renders a floating inspector trigger and Shadow DOM overlay in development.
- `@hawk-eye/vite-plugin` injects `data-source="file:line:column"` onto intrinsic JSX elements during Vite dev transforms.
- Clicking a live DOM element locks selection and reveals repo-relative source metadata in the overlay.
- Property editing and source-code mutation are not implemented yet.

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
- Automated coverage for source injection, HMR payload validation, and the client runtime

## What Does Not Work Yet

- Property editing controls
- Applying changes back to source files
- Rich diff review and persistence workflows

Those capabilities start in Phase 2 and later.

## Repository Layout

```text
hawk-eye/
├── packages/
│   ├── client/        # Embeddable React component
│   └── vite-plugin/   # Vite integration
├── demo/              # Local React + Tailwind demo app
├── docs/              # Architecture notes
├── tests/             # Smoke tests
└── .agents/           # Multi-agent handoff state
```

## Roadmap

1. Phase 2: Property editing and live preview
2. Phase 3: Code mutation and file persistence
3. Phase 4: Hardening, documentation, and release prep

Detailed status lives in [`.agents/PHASE_STATUS.md`](./.agents/PHASE_STATUS.md).

## Resources

- [Specification](./spec.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Current Context](./.agents/CURRENT_CONTEXT.md)
- [Decisions Log](./.agents/DECISIONS.md)

## License

MIT. See [LICENSE](./LICENSE).
