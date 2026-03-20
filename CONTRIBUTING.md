# Contributing to Hawk-Eye

This repository is in pre-alpha. The prerelease packaging pass is in progress and the public install story is `hawk-eye` with separate `.` and `./vite` exports.

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
├── AGENTS.md            # Agent entrypoint and memory workflow
├── CLAUDE.md            # Claude bridge into AGENTS.md
├── CODEX.md             # Codex bridge into AGENTS.md
├── GEMINI.md            # Gemini bridge into AGENTS.md
├── .memory/             # Canonical shared memory files
├── .agents/             # Legacy migration input
├── packages/
│   ├── client/          # Internal React runtime
│   ├── vite-plugin/     # Internal Vite integration
│   └── hawk-eye/        # Public package surface
├── demo/                # Local React + Tailwind app
├── docs/                # Architecture notes
├── tests/               # Vitest coverage
├── eslint.config.js     # Shared ESLint config
├── .prettierrc          # Shared Prettier config
└── tsup.config.ts       # Shared package build config
```

## Agent Memory Workflow

Read [`AGENTS.md`](./AGENTS.md) first. Then:

1. Read [`.memory/CURRENT_CONTEXT.md`](./.memory/CURRENT_CONTEXT.md)
2. Read [`.memory/MEMORY.md`](./.memory/MEMORY.md)
3. Skim [`.memory/BLOCKERS.md`](./.memory/BLOCKERS.md)
4. Check [`.memory/PHASE_STATUS.md`](./.memory/PHASE_STATUS.md)

No bootstrap command is required. The repo already contains the canonical memory protocol.

Default workflow:

1. Create or continue one session file in [`.memory/sessions/`](./.memory/sessions/) using [`.memory/templates/session.md`](./.memory/templates/session.md)
2. Append one receipt when opening and one when closing the session in [`.memory/receipts.jsonl`](./.memory/receipts.jsonl)
3. Store durable notes in [`.memory/notes/`](./.memory/notes/) using [`.memory/templates/note.md`](./.memory/templates/note.md)
4. Update [`.memory/CURRENT_CONTEXT.md`](./.memory/CURRENT_CONTEXT.md) when closing the session

Optional helpers:

```bash
pnpm memory:migrate
pnpm memory:doctor
```

Compatibility helpers remain available for one transition cycle, but they are not the required workflow.

`.agents/` is kept only as legacy import input for older clones and should not be treated as the live memory contract.

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
- Phase 1: complete
- Phase 2: complete
- Phase 3: writers and persistence are in place
- Phase 4: hardening and release prep

## Testing

The current test suite covers the client runtime, Vite plugin, and prerelease packaging flow.

- Use `pnpm test` for the current Vitest suite.
- Extend coverage as Phase 3 and later code lands.

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
