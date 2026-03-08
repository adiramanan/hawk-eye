# Hawk-Eye

Pre-alpha scaffold for an embeddable visual design tool for React interfaces.

> Use AI to generate UI. Use Hawk-Eye to inspect and refine it.

## Current Status

As of 2026-03-07, this repository has completed Phase 0 setup work:

- The pnpm workspace, TypeScript config, linting, builds, and demo app are wired up.
- `@hawk-eye/client` currently exports a placeholder `DesignTool` button.
- `@hawk-eye/vite-plugin` currently exports a serve-only Vite plugin shell.
- The inspector, source mapping, property editing, and source-code mutation flows are not implemented yet.

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
- One smoke test covering package exports and placeholder behavior

## What Does Not Work Yet

- Element inspection and hover overlays
- JSX source-to-element mapping
- Property editing controls
- Applying changes back to source files

Those capabilities start in Phase 1 and later.

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

1. Phase 1: Inspector overlay and source mapping
2. Phase 2: Property editing and live preview
3. Phase 3: Code mutation and file persistence
4. Phase 4: Hardening, documentation, and release prep

Detailed status lives in [`.agents/PHASE_STATUS.md`](./.agents/PHASE_STATUS.md).

## Resources

- [Specification](./spec.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Current Context](./.agents/CURRENT_CONTEXT.md)
- [Decisions Log](./.agents/DECISIONS.md)

## License

MIT. See [LICENSE](./LICENSE).
