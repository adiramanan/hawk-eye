# Architectural Decisions & Rationale

## D1: Package Manager Choice — pnpm Workspaces

**Decision:** Use pnpm with workspaces (not npm or bun)

**Rationale:**
- MVP spec explicitly specifies "pnpm workspaces"
- pnpm is the fastest monorepo package manager
  - Disk-efficient (content-addressable storage)
  - Prevents phantom dependencies (stricter than npm)
  - Vite ecosystem standard
- Aligns with modern npm package development best practices

**Alternatives Considered:**
- npm workspaces: Slower, looser dependency resolution, larger disk footprint
- bun: Immature ecosystem integration, less proven for pnpm patterns
- Turborepo: Over-engineered for MVP (adds CI/CD layer we don't need yet)

**Trade-offs:**
- Requires team familiarity with pnpm commands
- Slightly steeper onboarding (but CONTRIBUTING.md mitigates)
- `.pnpmrc` config needed to standardize across developers

**Status:** CONFIRMED (2025-03-07)

---

## D2: Build Tool for Packages — tsup

**Decision:** Use tsup for @hawk-eye/client and @hawk-eye/vite-plugin

**Rationale:**
- Zero-config TypeScript bundler (minimal setup friction)
- Ships ESM + CJS simultaneously (backwards compatible)
- Vite ecosystem standard for library publishing
- Fast, lean, no unnecessary abstractions

**Alternatives Considered:**
- esbuild (raw): More control, but more config needed
- Webpack: Overkill for libraries, slower builds
- tsc (raw TypeScript): No bundling, messy output

**Trade-offs:**
- tsup's defaults work for us; customization is simple but optional

**Status:** CONFIRMED (2025-03-07)

---

## D3: Source-to-Code Mapping — data-source Attributes

**Decision:** Use Babel transform to inject `data-source="path:line:col"` attributes on JSX elements

**Rationale:**
- Proven pattern: LocatorJS, Click-to-Component use this approach
- Non-invasive: only affects development builds (stripped in production)
- Low-friction: no runtime cost, clean mapping from element → file/line
- Backward compatible: doesn't break if attribute is removed

**Alternatives Considered:**
- Sourcemaps: Complex, requires source map integration
- AST analysis at runtime: Expensive, requires full source in client
- Manual prop injection: Requires developer discipline, error-prone

**Trade-offs:**
- Requires Babel plugin (adds compilation step, but already needed for JSX)
- Doesn't work with dynamically created elements

**Status:** CONFIRMED (2025-03-07)

---

## D4: Code Mutation — CSS ↔ Token Mapping (Tailwind) + AST (Inline Styles)

**Decision:**
- For Tailwind: bidirectional CSS property ↔ class mapping + string mutation
- For inline styles: ts-morph AST-based mutation

**Rationale:**
- Tailwind: Class-based, string in JSX → simple search/replace
- Inline styles: Object-based → need AST to safely mutate without breaking syntax
- Covers ~90%+ of AI-generated React code

**Alternatives Considered:**
- Unified regex approach: Fragile, breaks on edge cases
- Full AST for both: Over-engineered, slower

**Trade-offs:**
- Two different code paths (complexity)
- CSS Modules, styled-components unsupported in MVP (deferred to v0.2)

**Status:** CONFIRMED (2025-03-07)

---

## D5: Communication Protocol — WebSocket over Vite HMR

**Decision:** Use WebSocket to communicate between browser client and Vite dev server plugin

**Rationale:**
- Vite already runs WebSocket for HMR (we piggyback on existing channel)
- Bidirectional, low-latency
- No additional dependencies
- Integrates naturally with Vite's dev server lifecycle

**Alternatives Considered:**
- HTTP REST: Adds round-trip latency, stateless (loses context)
- Custom socket: Requires additional port, more setup friction
- Filesystem polling: Slow, unreliable

**Trade-offs:**
- Tied to Vite (deferred to other build tools in v0.2)
- Requires plugin to manage WebSocket server lifecycle

**Status:** CONFIRMED (2025-03-07)

---

## D6: Styling Approach — Tailwind Tokens + Arbitrary Values Fallback

**Decision:**
- Detect Tailwind; show scale options (e.g., rounded-lg, rounded-xl)
- Allow freeform custom values (e.g., rounded-[13px]) for precision
- For inline styles: no tokens, freeform numeric input

**Rationale:**
- Matches Figma's token selector UX (designer-familiar)
- Respects AI-generated code structure (Tailwind-first, inline-style-second)
- Allows designer intent (custom value) when scale doesn't fit
- Token awareness reduces visual guessing

**Alternatives Considered:**
- Force token compliance: Restricts designer, incompatible with AI output
- Full freeform only: Loses token information, less designer-friendly
- Read tailwind.config: Adds complexity, MVP uses default scale

**Trade-offs:**
- Token reading requires Tailwind config inspection (deferred to v0.1.1)
- Custom values need documentation (via CONTRIBUTING.md)

**Status:** CONFIRMED (2025-03-07)

---

## D7: TypeScript Target & Module Resolution

**Decision:**
- **target:** ES2020 (modern, let bundlers handle compatibility)
- **module:** ESNext (same)
- **moduleResolution:** node (standard)
- **strict:** true (all strictness flags enabled)

**Rationale:**
- Aligns with your existing projects (networth-new, portfolio)
- Modern target avoids polyfill bloat
- Bundlers (tsup, Vite) handle output compatibility
- Strict mode catches bugs early

**Alternatives Considered:**
- ES2015 target: Backward compatible, but unnecessary (Vite users are modern)
- loose strict mode: Introduces bugs, inconsistent with team

**Trade-offs:**
- Requires Node 18+ (we enforce 20.x via .nvmrc)

**Status:** CONFIRMED (2025-03-07)

---

## D8: Multi-Agent Handoff System

**Decision:** Use `.agents/` directory with MEMORY.md, CURRENT_CONTEXT.md, DECISIONS.md, BLOCKERS.md, PHASE_STATUS.md

**Rationale:**
- Enables seamless agent handoff (Claude Code ↔ Gemini Pro ↔ Codex)
- Single source of truth for project context
- Reduces context window waste (agents read summaries, not entire codebase)
- Async knowledge capture (learnings persist across sessions)

**How It Works:**
1. Each agent reads CURRENT_CONTEXT.md first (~2 min)
2. Then MEMORY.md for project patterns (~5 min)
3. Then BLOCKERS.md for known issues (~3 min)
4. Then PHASE_STATUS.md for progress (~2 min)
5. Total onboarding: ~12 minutes for new agent
6. At session end: update CURRENT_CONTEXT.md + add learnings to MEMORY.md

**Alternatives Considered:**
- Git commit messages: Too verbose, hard to scan
- README.md only: Not updated frequently, doesn't track in-progress work
- Slack/Discord: Not version-controlled, hard to reference

**Trade-offs:**
- Discipline required (agents must update at session end)
- Not a replacement for git history (complementary)

**Status:** CONFIRMED (2025-03-07)

---

## D9: Commit the pnpm Lockfile

**Decision:** Track `pnpm-lock.yaml` in git for this repository.

**Rationale:**
- Phase 0 should produce a reproducible install, not just a best-effort scaffold.
- Locking the workspace avoids agent-to-agent drift in dependency versions.
- It makes CI/local verification comparable across machines and worktrees.

**Alternatives Considered:**
- Ignore the lockfile: less churn, but non-reproducible installs
- Generate the lockfile only in CI: adds indirection and local mismatch risk

**Trade-offs:**
- Dependency bumps will update the lockfile
- Contributors must keep the lockfile in sync with manifest changes

**Status:** CONFIRMED (2026-03-07)

---

## D10: Phase 0 Documentation Should Be Truthful

**Decision:** Keep public docs aligned with the current scaffold and describe future functionality as roadmap work.

**Rationale:**
- The repository is pre-alpha and does not yet implement the README's original product claims.
- Truthful docs reduce onboarding friction and prevent agents from planning against non-existent code.
- Broken or aspirational links create avoidable maintenance overhead in a handoff-heavy repo.

**Alternatives Considered:**
- Keep aspirational marketing copy with disclaimers
- Only fix broken links and defer content alignment

**Trade-offs:**
- The README is less promotional today
- More updates will be needed as Phases 1-4 land

**Status:** CONFIRMED (2026-03-07)

---

## D11: Keep a Minimal Smoke-Test Baseline in Phase 0

**Decision:** Phase 0 includes one Vitest smoke test and a single-run `pnpm test` command.

**Rationale:**
- A stable test command is part of a finished setup phase.
- Even one smoke test protects the current package entrypoints from accidental regressions.
- It avoids the false impression that testing is configured when it currently exits with "No test files found."

**Alternatives Considered:**
- Pass with no tests via CLI flag only
- Remove the test script until later phases

**Trade-offs:**
- The test suite remains very shallow until feature work begins
- Contributors must update the smoke test if placeholder exports change

**Status:** CONFIRMED (2026-03-07)

---

## Decision Review Schedule
- Every phase end, review decisions with latest learnings
- Update rationale if new context emerges
- Close decisions when fully resolved (mark as DONE)
