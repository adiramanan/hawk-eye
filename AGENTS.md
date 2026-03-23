# Hawk-Eye Agent Protocol

## Canonical Memory
- The shared project memory is file-native and lives entirely under [`.memory/`](./.memory/).
- Read [`.memory/CURRENT_CONTEXT.md`](./.memory/CURRENT_CONTEXT.md), [`.memory/MEMORY.md`](./.memory/MEMORY.md), [`.memory/BLOCKERS.md`](./.memory/BLOCKERS.md), and [`.memory/PHASE_STATUS.md`](./.memory/PHASE_STATUS.md) before broad changes.
- Treat [`.agents/`](./.agents/) and any old `~/.hawk-eye/projects/...` store as legacy migration input only.

## Default Workflow
- No bootstrap command is required. The repo already contains the canonical memory structure.
- Create or continue a session file in [`.memory/sessions/`](./.memory/sessions/) using [`.memory/templates/session.md`](./.memory/templates/session.md).
- Append one JSON receipt on session open and one on session close to [`.memory/receipts.jsonl`](./.memory/receipts.jsonl).
- Store durable notes in [`.memory/notes/`](./.memory/notes/) using [`.memory/templates/note.md`](./.memory/templates/note.md).
- If you need to capture a local artifact, either reference its repo-relative path in a note or copy it into [`.memory/attachments/`](./.memory/attachments/) and record that attachment in the matching note.
- When you close a session, update [`.memory/CURRENT_CONTEXT.md`](./.memory/CURRENT_CONTEXT.md) with the latest summary and touched areas.

## Session Rules
- New session files use the format `.memory/sessions/<utc-timestamp>--<agent-slug>.md`.
- Required session frontmatter keys: `sessionId`, `agent`, `startedAt`, `endedAt`, `status`, `branch`, `goal`, `touched`.
- Session bodies keep these sections: `Context`, `Actions`, `Decisions`, `Open Threads`, `Summary`.
- `status` is `open` while work is active and `closed` when the session is done.

## Notes And Receipts
- Required note frontmatter keys: `id`, `kind`, `title`, `createdAt`, `agent`, `tags`, `sourceType`, `sourcePath`, `sessionId`.
- `checksum` and `attachmentPath` are optional helper-generated fields, not required for manual note creation.
- Receipt fields: `event`, `sessionId`, `agent`, `timestamp`, `touchedFiles`, `memoryWrites`, `summary`.

## Optional Helpers
- Helper commands are optional, not required.
- `pnpm memory:migrate` imports legacy `.agents/` content and any old CLI-created local store into the repo-native `.memory/` layout.
- `pnpm memory:doctor` validates the repo-native protocol.
- Compatibility commands remain available for one transition cycle and write directly into `.memory/`.
