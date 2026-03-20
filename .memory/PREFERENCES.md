# Preferences

## Tooling
- Prefer `pnpm` workspace commands for product development.
- Keep repo-internal helper tooling simple and dependency-light.
- Use Vitest for protocol and helper verification.

## Memory Workflow
- `.memory/` is canonical.
- `AGENTS.md` is the primary protocol entrypoint.
- `CLAUDE.md`, `CODEX.md`, and `GEMINI.md` are bridge files only.
- `.agents/` and any old local helper store are legacy inputs only.
- `pnpm memory:migrate` and `pnpm memory:doctor` are optional helpers, not required bootstrap steps.
