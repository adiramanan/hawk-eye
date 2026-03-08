# Contributing to Hawk-Eye

This repository is in pre-alpha. Phase 0 setup is complete; Phase 1 feature work has not started yet.

## Development Setup

### Prerequisites

- Node 20.x or higher
- pnpm 8.0 or higher

```bash
nvm use
pnpm install
```

## Common Commands

```bash
pnpm dev
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

## Project Structure

```text
hawk-eye/
├── .agents/             # Multi-agent handoff files
├── packages/
│   ├── client/          # @hawk-eye/client
│   └── vite-plugin/     # @hawk-eye/vite-plugin
├── demo/                # Local React + Tailwind app
├── docs/                # Architecture notes
├── tests/               # Smoke tests
├── eslint.config.js     # Shared ESLint config
├── .prettierrc          # Shared Prettier config
└── tsup.config.ts       # Shared package build config
```

## Multi-Agent Handoff Ritual

When starting work:

1. Read [`.agents/CURRENT_CONTEXT.md`](./.agents/CURRENT_CONTEXT.md)
2. Read [`.agents/MEMORY.md`](./.agents/MEMORY.md)
3. Skim [`.agents/BLOCKERS.md`](./.agents/BLOCKERS.md)
4. Check [`.agents/PHASE_STATUS.md`](./.agents/PHASE_STATUS.md)

When ending work:

1. Update `CURRENT_CONTEXT.md`
2. Record durable learnings in `MEMORY.md` or `DECISIONS.md`
3. Add blockers if any new ones were discovered

## Git Workflow

Suggested commit types:

- `feat`: new feature work
- `fix`: bug fix
- `refactor`: structural changes without behavior change
- `docs`: documentation updates
- `chore`: tooling or setup changes
- `test`: test additions or fixes

## Phase Guidance

- Phase 0: complete
- Phase 1: next milestone, focused on inspector/source mapping
- Phase 2: property editing and live preview
- Phase 3: writers and file persistence
- Phase 4: hardening and release prep

## Testing

Phase 0 keeps a minimal smoke-test baseline so `pnpm test` is stable.

- Use `pnpm test` for the current Vitest smoke suite.
- Add broader behavioral coverage as Phase 1 and later code lands.

## Troubleshooting

Missing dependencies:

```bash
pnpm install
```

Validation:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```
