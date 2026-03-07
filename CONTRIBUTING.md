# Contributing to Hawk-Eye

Thanks for contributing! This guide covers development setup, workflow, and the multi-agent handoff system.

## Development Setup

### Prerequisites

- **Node:** 20.x or higher (check `.nvmrc`)
- **pnpm:** 8.0 or higher

```bash
# Install Node (if needed)
nvm use  # auto-read .nvmrc

# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Start dev servers (client, plugin, demo)
pnpm dev

# Build all packages
pnpm build

# Build specific package
pnpm build:client
pnpm build:plugin

# Type check all packages
pnpm type-check

# Lint
pnpm lint
pnpm lint:fix

# Format code
pnpm format
pnpm format:check

# Run tests
pnpm test
```

## Project Structure

```
hawk-eye/
├── .agents/               # Multi-agent memory & handoff
├── packages/
│   ├── client/            # @hawk-eye/client (embeddable component)
│   └── vite-plugin/       # @hawk-eye/vite-plugin (Vite plugin)
├── demo/                  # Example app
├── docs/                  # Documentation
├── .eslintrc.json         # ESLint config (shared)
├── .prettierrc             # Prettier config (shared)
└── tsup.config.ts         # Build config for packages
```

## Multi-Agent Handoff Ritual

Since this project is developed across multiple AI agents (Claude Code, Gemini Pro, Codex) in ad-hoc workflows, we use a structured handoff system.

### When Starting Work (First 12 minutes)

1. **Read CURRENT_CONTEXT.md** (2 min)
   - Where did the last agent leave off?
   - What's the immediate next task?

2. **Read MEMORY.md** (5 min)
   - What are the key architectural decisions?
   - What patterns are we following?
   - Any solutions to recurring problems?

3. **Skim BLOCKERS.md** (3 min)
   - What's known to be hard or broken?
   - Are there workarounds?

4. **Check PHASE_STATUS.md** (2 min)
   - What's the overall progress?
   - Which phase are we in?

### When Ending Your Session

1. **Update CURRENT_CONTEXT.md**
   - What did you accomplish?
   - Where did you leave off?
   - What's the next immediate task?

2. **Add Learnings to MEMORY.md**
   - Any new patterns discovered?
   - Solutions to problems?
   - Important links or files?

3. **Create Session Log (Optional)**
   - Save a summary in `.agents/sessions/[your-agent-date].md`
   - Helps with async knowledge capture

4. **Document Blockers (If Applicable)**
   - Add to BLOCKERS.md with reproduction steps
   - Include file paths and line numbers

## Git Workflow

### Branch Naming

- Feature: `feature/inspector-overlay`
- Fix: `fix/babel-transform-edge-case`
- Docs: `docs/architecture-guide`

### Commit Message Format

```
<type>: <short summary> (under 70 chars)

<optional detailed description>

Related to Phase X: <phase name>
```

Example:
```
feat: implement element inspector with hover overlay

- Add bounding box rendering with dimension labels
- Implement pointer event interception during inspector mode
- Create Shadow DOM isolation for style safety

Related to Phase 1: Inspector Overlay & Source Injection
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation updates
- `chore`: Tooling, config, or setup changes
- `test`: Test additions or fixes

## Phase Guidelines

The MVP is structured in 4 phases. Know which phase you're in:

### Phase 0: Setup (Current)
- Repository structure, tooling, configs
- Status: IN PROGRESS

### Phase 1: Inspector
- Element selection, source mapping, WebSocket bridge
- Status: NOT STARTED

### Phase 2: Properties Panel
- Visual editing UI, live preview, change accumulator
- Status: NOT STARTED

### Phase 3: Code Writers
- Code mutation, file writing, HMR
- Status: NOT STARTED

### Phase 4: Polish
- Edge cases, error handling, public release
- Status: NOT STARTED

See `.agents/PHASE_STATUS.md` for detailed checklists.

## Code Style

We use **ESLint + Prettier** for consistency.

```bash
# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Key Rules

- **Strict TypeScript:** All code must pass `pnpm type-check`
- **No console.log:** Use warnings/errors only (see .eslintrc.json)
- **No unused variables:** Mark intentionally unused params with underscore (`_param`)
- **React:** Use functional components and hooks

## Testing

Tests are configured but not yet in use (Phase 2+). When implementing tests:

```bash
pnpm test
```

Uses **vitest** (fast, Vite-native).

## Architecture Decisions

Before making significant changes, check `.agents/DECISIONS.md` to understand the rationale behind key choices (pnpm, tsup, data-source attributes, etc.).

If you make a new architectural decision, document it in DECISIONS.md with:
- **Decision:** What choice did you make?
- **Rationale:** Why?
- **Alternatives Considered:** What else could you have done?
- **Trade-offs:** What are the costs?

## Troubleshooting

### pnpm install fails
```bash
pnpm install --force
# Clear cache if still stuck
pnpm store prune
```

### TypeScript errors
```bash
# Type-check all packages
pnpm type-check

# Or target one
pnpm -F @hawk-eye/client type-check
```

### ESLint complaints
```bash
# Auto-fix most issues
pnpm lint:fix

# Format while you're at it
pnpm format
```

### Build fails
```bash
# Clean and rebuild
rm -rf packages/*/dist demo/dist
pnpm build
```

## Questions?

1. Check [MEMORY.md](./.agents/MEMORY.md) for project context
2. Check [DECISIONS.md](./.agents/DECISIONS.md) for architectural rationale
3. Check [BLOCKERS.md](./.agents/BLOCKERS.md) for known issues
4. Review the spec at the top of this repo for full context

---

**Happy coding! Remember to update CURRENT_CONTEXT.md before you leave.** ✨
