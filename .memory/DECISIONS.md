# Memory Decisions

## D1: Repo-Native Protocol
- Canonical shared memory lives entirely in `.memory/`.
- `AGENTS.md` is the single source of truth for the protocol.

## D2: Helper Commands Are Optional
- The repo memory system must be usable by agents through direct file edits alone.
- `scripts/hawk-memory.mjs` remains as convenience tooling, not as a required workflow dependency.

## D3: Structured Sessions And Receipts
- Sessions are tracked as one markdown file per work session in `.memory/sessions/`.
- Open and closed session events are appended to `.memory/receipts.jsonl`.

## D4: Legacy Sources
- `.agents/` and the old CLI-created local store are treated as migration inputs only.
- Legacy data may be imported into `.memory/` but is not part of the live protocol.
