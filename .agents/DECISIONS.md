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

## D17: Figma-Style Focused Property Groups

**Decision:** In focused mode, replace the current 10 CSS-centric groups with 5 Figma-style sections (Layout, Fill, Typography, Design, Effects), showing only 15 essential properties. The full 60+ property set remains accessible via a toggle.

**Rationale:**
- Designers think in terms of spatial, color, type, shape, and depth adjustments — not CSS categories
- 15 properties cover the most common "polish" operations: spacing, colors, font size/weight/alignment, border-radius, box-shadow
- Matches Figma's inspector mental model (Layout, Fill, Typography, Design, Effects)
- Reduces cognitive load for non-developers doing quick design fixes
- Supports the product goal of reducing token usage for small design fixes (no AI needed)

**Alternatives Considered:**
- Keep all 60+ properties with better search: Still overwhelming for non-technical users
- Fixed minimal set with no toggle: Limits power users who need advanced properties
- Per-element smart filtering: Too complex, unpredictable for users

**Trade-offs:**
- Two rendering modes in PropertiesPanel (focused vs full) add complexity
- Some properties designers might want (opacity, overflow) are excluded from the minimal set
- Group names differ between modes (Layout vs Spacing/Auto Layout) which could confuse users switching between modes

**Status:** CONFIRMED (2026-03-12)

---

## D18: Smart Style Detection with Detach

**Decision:** Detect Tailwind vs inline vs mixed style strategies server-side using ts-morph JSX analysis. Add a "Detach" toggle that converts class-based elements to pure inline styles (like Figma's "detach instance").

**Rationale:**
- Different style strategies require different write approaches (class swap vs inline mutation)
- Server-side analysis using ts-morph reads the actual source AST — more reliable than client-side heuristics
- The "Detach" concept is familiar to Figma/Framer users — gives a clean break from the class system
- Only string literal className values are analyzed; dynamic expressions (cn/clsx/ternaries) fall back to inline styles

**How Detach Works:**
1. User clicks "Detach" on a class-based element
2. Client reads `getComputedStyle` for all 15 focused properties
3. All values populate the draft as dirty properties
4. Draft's `styleMode` becomes `'detached'`
5. On save: writer removes `className` attribute, writes all properties as inline `style`

**Alternatives Considered:**
- Client-side only detection (check element.className): Can't distinguish Tailwind from BEM/custom classes
- Always write inline styles: Loses Tailwind class structure for non-detached elements
- No detach feature: Limits designer freedom when classes are too constraining

**Trade-offs:**
- Detach is destructive (removes all classes) — should be clearly labeled and possibly confirmable
- Server roundtrip for style analysis adds latency on element selection
- Dynamic className expressions remain opaque

**Status:** CONFIRMED (2026-03-12)

---

## D19: Save-to-Branch Workflow

**Decision:** On save, create a new git branch from current HEAD, write mutations to source files via AST, commit the changes, and switch back to the original branch. User reviews changes via PR diff. Abort if working tree has uncommitted changes.

**Rationale:**
- Safest approach: working tree stays clean, changes are isolated on a branch
- Fully reversible: user can delete the branch if changes are wrong
- PR-based review is natural for developers and enables collaboration
- Git operations happen server-side in the Vite plugin (has Node.js access via child_process)
- Branch naming (`hawk-eye/design-tweaks-{timestamp}`) makes changes easy to identify

**Save Flow:**
1. `git status --porcelain` — abort if dirty
2. `git rev-parse --abbrev-ref HEAD` — save current branch
3. `git checkout -b hawk-eye/design-tweaks-{timestamp}` — create new branch
4. Run source-writer to mutate files
5. `git add` + `git commit` modified files
6. `git checkout {original-branch}` — switch back
7. Send result to client

**Alternatives Considered:**
- Write to files directly (no branch): Risky, pollutes working tree, hard to review
- Generate patch/diff only: Zero risk but requires manual application
- Auto-create PR: Too invasive, requires GitHub auth

**Trade-offs:**
- Requires clean working tree (user must commit/stash first)
- Git operations are not atomic — if step 5 fails, user is left on the new branch
- Multiple save sessions create multiple branches (could clutter)

**Status:** CONFIRMED (2026-03-12)

---

## D20: Context-Aware Panel — Section Visibility Based on Element Type

**Decision:** Compute an `ElementContext` on element selection (client-side, synchronous, no server roundtrip) and use it to conditionally show or hide entire sections in the PropertiesPanel. Initially scoped to section-level visibility only — no per-property hiding.

**Rationale:**
- A `div` with no text content has no use for Typography controls — showing them creates noise and confusion
- The target user (AI prototypers, designers) should see only what is relevant to the selected element
- Detection is cheap: tag name, direct text nodes, and `getComputedStyle` are all available synchronously on the already-selected `HTMLElement`
- Section-level granularity is conservative and predictable — hiding a full section is obvious, hiding individual properties within a visible section is surprising
- Aligns with how Figma conditionally shows/hides sections (e.g., no Typography panel on a frame with no text)

**Detection Signals (all client-side, synchronous):**
1. `tagName` — element tag in lowercase
2. `isTextElement` — element is a known text-bearing tag: `p`, `h1–h6`, `span`, `a`, `label`, `li`, `td`, `th`, `caption`, `blockquote`, `cite`, `code`, `pre`, `em`, `strong`, `small`, `sub`, `sup`, `dt`, `dd`, `figcaption`, `button`
3. `hasDirectText` — element has at least one non-whitespace direct text-node child (not descendant — just immediate children)
4. `hasNonDefaultTypography` — any of `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign` in `getComputedStyle` differ from known browser defaults
5. `isReplaced` — element is a replaced element (`img`, `video`, `canvas`, `iframe`, `input`, `select`, `textarea`) — these can never contain styled text

**Section Visibility Rules:**
| Section    | Show when |
|------------|-----------|
| Appearance | Always |
| Typography | `isTextElement OR hasDirectText OR hasNonDefaultTypography` |
| Border     | Always |

**Why always show Appearance and Border?**
- Appearance (fill, opacity, corner radius): applicable to every visual element
- Border: a designer may want to *add* a border to any element, not just elements that already have one; hiding it would make adding borders impossible

**Data Model:**
```ts
// Added to types.ts
interface ElementContext {
  tagName: string;
  isTextElement: boolean;
  hasDirectText: boolean;
  hasNonDefaultTypography: boolean;
  isReplaced: boolean;
}

// Added to SelectionDraft
interface SelectionDraft {
  // ... existing fields ...
  context: ElementContext;
}
```

**Alternatives Considered:**
- Per-property hiding (e.g., hide `letterSpacing` for non-text): Too granular, feels broken when a property disappears mid-session as the element changes
- Server-side detection: Unnecessary — all signals are available from the DOM
- Always show all sections: Current behaviour — creates noise for non-text elements
- Tag-name whitelist only (no computed style check): Misses `div`s that have been given font styling explicitly

**Trade-offs:**
- `hasNonDefaultTypography` requires a `getComputedStyle` call, which forces a style recalc — acceptable since it happens once on selection, not on every render
- "Browser defaults" for typography must be hardcoded (e.g., `Times New Roman` for `fontFamily` on body) — fragile across browsers; use a conservative list or compare against `document.body` computed style
- If a `div` has text children but the user deletes them, Typography stays visible until the next re-selection — acceptable UX

**Status:** CONFIRMED (2026-03-16)

---

## D21: Figma Size Control Semantics Over Raw CSS Heuristics

**Decision:** Width and height use four explicit modes (`fixed`, `hug`, `fill`, `relative`) with persisted metadata, constrained units, and field-value-based aspect-ratio locking.

**Specifically:**
- Persist width/height mode semantics with inline custom properties:
  - `--hawk-eye-width-mode`
  - `--hawk-eye-height-mode`
- `fixed` always edits numeric `px` values
- `relative` always edits numeric `%` values
- `hug` maps to `fit-content`
- `fill` maps to `100%`
- Aspect ratio lock stores the ratio from the current width/height field values when the lock is enabled
- Single-unit controls render a static unit label, not a dropdown
- The properties panel width stays fixed at 320px to match the Figma layout

**Rationale:**
- Raw CSS cannot distinguish `relative 100%` from `fill 100%`, so mode semantics must be persisted explicitly
- Designers expect width/height mode changes to preserve the last numeric value per mode rather than inventing fallback sizes
- Locking against the rendered DOM box produces incorrect behavior when layout constraints distort the actual rendered size
- A dropdown chevron with only one valid unit is misleading UI
- The Figma reference uses a fixed-width panel; allowing the size row to stretch the panel breaks parity

**Alternatives Considered:**
- Infer size mode from CSS on every render with no persisted metadata: simpler, but loses `relative 100%` vs `fill 100%`
- Use `getBoundingClientRect()` for aspect-ratio lock: matches rendered box, but not the values the user is editing
- Allow multiple numeric units for fixed/relative: more flexible, but diverges from the Figma control and increases state complexity
- Keep native unit `<select>` for single-unit controls: technically works, but creates a fake affordance

**Trade-offs:**
- Requires additional state in `SelectionDraft.sizeControl`
- Requires plugin-side support to persist metadata while excluding it from style-strategy analysis
- Introduces more client-side logic around size memory, inference, and reset behavior

**Status:** CONFIRMED (2026-03-17)

---

## Decision Review Schedule
- Every phase end, review decisions with latest learnings
- Update rationale if new context emerges
- Close decisions when fully resolved (mark as DONE)
