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

## D12: Phase 2 Uses Session-Scoped DOM Preview Overrides

**Decision:** Apply Phase 2 edits as temporary inline style overrides in the browser, keyed by `data-source`, and clear them on reset, inspector exit, or reload.

**Rationale:**
- Phase 2 should feel like a visual editor without taking on Phase 3’s source-writing complexity.
- Session-scoped drafts let users compare multiple elements in one inspector session without committing anything to code.
- Keying drafts by source token keeps the preview model compatible with the existing Phase 1 selection bridge.

**Alternatives Considered:**
- Only keep edits for the currently selected element
- Add file persistence in Phase 2
- Rewrite classes immediately instead of previewing in the DOM

**Trade-offs:**
- Preview edits are temporary and disappear on reload
- Inline preview overrides can diverge from the source styling strategy until Phase 3 translates them back into code
- The client must preserve the original detected styling mode even after preview adds inline styles

**Status:** CONFIRMED (2026-03-10)

---

## D13: Rich Control Architecture — Data-Driven Control Dispatcher

**Decision:** Expand the `EditablePropertyControl` type union and use a `renderControl()` dispatcher in PropertiesPanel that switches on the control type to render the appropriate component.

**Rationale:**
- The current architecture already uses a data-driven approach (property definitions array is the single source of truth)
- A dispatcher pattern scales cleanly from 2 control types to 10+ without spaghetti conditionals
- Each control component is self-contained and independently testable
- New control types require only: (1) add to the union type, (2) build the component, (3) add a case to the dispatcher

**Alternatives Considered:**
- Render props / component-in-definition: More flexible but harder to type and test
- Single polymorphic input component: Becomes a god component, violates SRP

**Trade-offs:**
- More files to maintain (one per control type)
- All controls must conform to a common value/onChange interface (CSS string in, CSS string out)

**Status:** CONFIRMED (2026-03-10)

---

## D14: Styles Module Split

**Decision:** Split `styles.ts` (429 lines) into `styles/base.ts`, `styles/controls.ts`, `styles/sections.ts`, and `styles/index.ts`. The combined export (`hawkEyeStyles`) stays the same.

**Rationale:**
- Adding 7+ control components and 10+ section layouts will grow styles to 1500-2000+ lines
- Module split keeps each file focused and reviewable
- No breaking change to the existing import contract

**Alternatives Considered:**
- Keep everything in one file: Unmaintainable at 2000+ lines
- CSS-in-JS per component: Shadow DOM requires all styles in one stylesheet injection
- External CSS file: Breaks Shadow DOM isolation

**Trade-offs:**
- Slightly more import indirection
- Must ensure all modules contribute to a single concatenated string

**Status:** CONFIRMED (2026-03-10)

---

## D15: Per-Side Control Pattern

**Decision:** A single `PerSideControl` component maps to 4 `EditablePropertyId` values (top/right/bottom/left). It receives 4 snapshots and calls `onChange(id, value)` for each affected side. Linked mode calls it for all 4.

**Rationale:**
- Replaces 8 separate text inputs with 2 compact visual controls (padding + margin)
- The draft system already supports per-property changes — no architectural change needed
- Link/unlink matches Framer's UX and is a standard design tool pattern

**Alternatives Considered:**
- Shorthand property (e.g., `padding: 8px 16px`): Harder to diff, less granular control
- Keep individual text inputs: Works but doesn't feel like a design tool

**Trade-offs:**
- The PerSideControl must know about 4 property IDs, creating tighter coupling than a simple input
- Linked mode must fire 4 onChange calls atomically

**Status:** CONFIRMED (2026-03-10)

---

## D16: Custom Color Picker in Shadow DOM

**Decision:** Build a custom inline color picker using `<canvas>` for the saturation/lightness gradient and hue bar. No external component library.

**Rationale:**
- Shadow DOM prevents using any external color picker library that depends on global styles
- `<canvas>` is the standard approach for gradient rendering in design tools
- Keeps the bundle lightweight (no additional dependency)
- The picker API is simple: input a CSS color string, output a CSS color string

**Alternatives Considered:**
- `<input type="color">`: Browser-native but no opacity control, limited customization, breaks Shadow DOM isolation
- External library (react-color, etc.): Can't render correctly inside Shadow DOM
- Text-only input: Works but doesn't feel like a design tool

**Trade-offs:**
- Most complex single control to build (~200-300 lines)
- Canvas rendering doesn't work in jsdom tests (test logic separately from rendering)
- Color conversion utilities needed (hex ↔ rgb ↔ hsl)

**Status:** CONFIRMED (2026-03-10)

---

## Decision Review Schedule
- Every phase end, review decisions with latest learnings
- Update rationale if new context emerges
- Close decisions when fully resolved (mark as DONE)
