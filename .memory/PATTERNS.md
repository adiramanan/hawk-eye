# Patterns

## Repo Memory Patterns
- Read `.memory/CURRENT_CONTEXT.md`, `.memory/MEMORY.md`, `.memory/BLOCKERS.md`, and `.memory/PHASE_STATUS.md` before broad changes.
- Create or continue one session file per workstream in `.memory/sessions/`.
- Append receipt entries to `.memory/receipts.jsonl` on session open and close.
- Record durable notes in `.memory/notes/`.
- Update `.memory/CURRENT_CONTEXT.md` when a session is closed.

## Implementation Patterns
- Prefer Node built-ins for repo-internal helper tooling unless a dependency already exists for another reason.
- Keep product-facing package exports unchanged when adding infrastructure.
- Keep the helper tooling aligned with the file-native protocol rather than inventing a parallel state model.
