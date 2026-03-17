# Hawk-Eye Shared Memory

## Project Overview
**Hawk-Eye** is an open-source, embeddable visual design tool for React applications. It lets designers refine AI-generated interfaces through direct manipulation (Figma-style) while persisting changes as real source code.

**Target User:** AI Prototypers — designers using Claude Code, v0, Bolt, Lovable, or Cursor to generate React apps who lack coding fluency for precise visual adjustments.

**MVP Scope:** Phase 1–4 over 5–7 weeks. Focus on Tailwind CSS + inline styles (90%+ of AI-generated React code).

**Repository:** hawk-eye (this repo)
**Monorepo Structure:** pnpm workspaces
- `@hawk-eye/client` — embeddable React component
- `@hawk-eye/vite-plugin` — Vite dev server plugin
- `hawk-eye-demo` — example React + Tailwind app
- `docs/` — documentation

---

## Tech Stack Summary
- **Language:** TypeScript ^5.9.2 (strict mode)
- **Node:** 20.x or higher (`.nvmrc` enforces this)
- **Package Manager:** pnpm with workspaces
- **Client Build:** tsup → ESM bundle
- **Plugin Build:** tsup → ESM bundle
- **Demo Build:** Vite
- **Linting:** ESLint + @typescript-eslint, Prettier
- **Testing:** Vitest smoke-test baseline in Phase 0

---

## Key Architectural Decisions

### Why pnpm?
- The spec mandates "pnpm workspaces"
- Fastest monorepo manager (disk-efficient, phantom dependency prevention)
- Vite ecosystem standard
- See DECISIONS.md for trade-offs vs npm/bun

### Why tsup for packages?
- Zero-config TypeScript bundler for npm packages
- Outputs clean ESM + CJS
- Minimal configuration needed

### Why ESM-first modules?
- Modern standard for npm packages
- Vite ecosystem expectation
- Tree-shakeable

### Data Attributes for Source Mapping
- Babel transform injects `data-source="path/to/file.tsx:line:col"` on elements
- Enables inspector to map clicked elements back to source code
- Same pattern as LocatorJS, Click-to-Component (proven, low-friction)

---

## Confirmed Patterns & Conventions

### Directory Layout
```
packages/client/src/
├── DesignTool.tsx          # Root runtime + session state
├── Inspector.tsx           # Overlay shell + panel container
├── PropertiesPanel.tsx     # Guided property controls + pending changes
├── editable-properties.ts  # Property metadata
├── drafts.ts               # Live preview draft helpers
├── ws-client.ts            # WebSocket client
├── styles.ts               # CSS injected into Shadow DOM
└── types.ts                # Internal runtime types

packages/vite-plugin/src/
├── index.ts               # Plugin entry
├── source-injector.ts     # Babel transform
└── ws-server.ts           # WebSocket handler
```

### TypeScript Paths
- `@/*` → `src/*` (consistent with existing projects)
- Configured in root tsconfig, inherited by packages

### Shared Dependencies
- Root dev deps: ESLint, Prettier, TypeScript, tsup, Vite, concurrently
- Package-specific: see package.json files

---

## Current Implementation Surface
- `@hawk-eye/client` exports a dev-only inspector with a floating trigger, hover outline, click-to-lock selection, source info panel, guided property controls, and session-scoped live preview edits.
- `@hawk-eye/vite-plugin` injects `data-source` metadata into intrinsic JSX elements and replies to selection requests over Vite HMR.
- The demo app exercises the full Phase 2 inspector and live-preview flow in a React + Vite + Tailwind environment.

## Known Issues & Workarounds
- Packages are not published yet; evaluate through the local workspace/demo.
- Do not reintroduce a `./styles` export in `@hawk-eye/client` until a real CSS artifact exists.

---

## Phase Progress
- **Phase 0 (Setup):** COMPLETE
  - Monorepo structure
  - TypeScript + tooling config
  - Agent handoff system
  - Truthful docs, MIT license, and smoke-test baseline

- **Phase 1 (Inspector):** COMPLETE
  - Babel source injection
  - Hover overlay + element selection
  - Vite HMR bridge to the plugin

- **Phase 2 (Properties Panel):** COMPLETE
  - Guided properties UI controls (60+ CSS properties, 8 control types, 10 groups)
  - Live preview via DOM style overrides
  - Session-scoped draft accumulation and reset behavior
  - Search, keyboard navigation, resizable panel

- **Phase 3 (Designer-Friendly Editor + Code Writers + Save-to-Branch):** COMPLETE (3.1–3.6, UI Refinement, 3.9–3.10)
  - 3.1: Focused 15-property subset with Figma-style sections (Layout/Fill/Typography/Design/Effects)
  - 3.2: Server-side style strategy detection (Tailwind vs inline vs mixed)
  - 3.3: Bidirectional Tailwind CSS-to-class mapping
  - 3.4: AST mutation writer using ts-morph
  - 3.5: Detach-from-classes toggle (like Figma's detach instance)
  - 3.6: Save-to-branch workflow (git branch + commit + switch back)
  - UI Refinement: Figma design parity for PropertiesPanel (2026-03-16)
  - 3.9: Complete Properties Panel (all 6 MVP sections visible)
  - 3.10: Size & Spacing section redesign with Fixed/Hug/Fill modes (2026-03-17) — "kind of working" status

- **Phase 4 (Polish):** NOT STARTED
  - Edge case handling
  - Error boundaries
  - Documentation
  - Public release

---

## Useful Links & References
- Specification: `spec.md`
- Architecture: `docs/ARCHITECTURE.md`
- pnpm docs: https://pnpm.io/workspaces
- ts-morph: https://ts-morph.com/ (AST manipulation)
- tailwind-merge: https://github.com/dcastil/tailwind-merge
- LocatorJS: https://www.locatorjs.com/ (element-to-source pattern)

---

## Phase 3.10 Key Learnings

### SizeInput Component (Fixed/Hug/Fill Pattern)
- **CSS value mapping:** Hug → `fit-content`, Fill → `100%`, Fixed → numeric value (e.g. `200px`, `50%`, `10rem`)
- **Mode detection:** Check `value === 'fit-content'` for Hug, `value === '100%'` for Fill, else Fixed
- **Conditional rendering:** Show numeric value + unit inputs **only** when in Fixed mode; Hug/Fill hide these inputs
- **Native selects are reliable:** Custom absolutely-positioned dropdown menus have event propagation issues (clicks don't register reliably). Switched to native `<select>` elements — more robust, matches browser expectations
- **Arrow key incrementing:** Support ↑/↓ with optional Shift for 10x multiplier (similar to Figma number inputs)
- **Unit handling in SizeInput:**
  - Display: strip unit from value, show just the number in the input
  - On change: re-append the selected unit to the number
  - This pattern prevents unit confusion and allows easy unit switching

### Corner Radius All/Each Toggle
- Simple React `useState('all' | 'each')` for mode tracking
- All mode: single input applies to all corners
- Each mode: 4 separate inputs for each corner (topLeft, topRight, bottomRight, bottomLeft)
- Layout: Each mode shows `[0px|0px|0px|0px]` pill with `#4c4c4c` dividers (borrowed from PerSideControl pattern)

### Size & Spacing Section Merge
- Combined Frame (positionSize) + Spacing into single "Size & Spacing" section
- Order: W/H with modes → Corner Radius → Position type → X/Y → Padding → Margin
- Aspect ratio lock button (32x32px, #e1f1ff background) is a UI placeholder — no constraint enforcement logic yet

## Phase 3 Key Patterns

### Focused Property Set (as of 2026-03-17)
3 sections visible in the panel (expanded from the original 5 Figma-style groups):

| Section    | Properties | Count |
|------------|-----------|-------|
| Appearance | backgroundColor, opacity, borderRadius + 4 corner radii | 7 |
| Typography | fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign | 6 |
| Border     | borderStyle, borderColor, strokeDasharray, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth | 7 |

The original Layout/Fill/Typography/Design/Effects groupings still exist in `focusedGroupMembers` for the save/write pipeline — only the UI surface changed.

### Style Strategy Detection
- Server-side ts-morph analysis of JSX source at `line:column`
- Returns `StyleMode`: `'inline' | 'tailwind' | 'mixed' | 'detached' | 'unknown'`
- Only processes string literal `className` — dynamic expressions (cn/clsx/ternaries) report as `'unknown'`

### AST Writer
- `writeSourceMutations(root, payload)` lives in `packages/vite-plugin/src/source-writer.ts`
- Handles Tailwind class swaps, inline style object upserts, mixed-mode fallback, and detached writes
- Returns structured warnings for unsupported dynamic `className` and dynamic `style` cases

### Detach Flow
- `SelectionDraft` now includes `detached: boolean`
- `detachDraft(draft, element)` snapshots the focused property set into inline preview values and flips `styleMode` to `'detached'`
- Detached drafts survive later style-analysis hydration during the same session

### Save Workflow
- Creates branch `hawk-eye/design-tweaks-{YYYYMMDD-HHmmss}` from HEAD
- Writes mutations → commits → switches back to original branch
- Aborts if working tree is dirty (uncommitted changes)
- Resolves the actual git root even when the Vite root is nested inside it
- Returns the branch name, commit SHA, and any writer warnings back to the inspector

### Dependencies Already Available
- `ts-morph ^21.0.0` — in `@hawk-eye/vite-plugin` package.json (for style analysis + source writing)
- `diff ^5.1.0` — in `@hawk-eye/vite-plugin` package.json (for change previews)
- `tailwindPrefix` field on every property definition — maps to Tailwind class prefix

### Parallelism
Phases 3.1, 3.2, 3.3 can run fully in parallel (no dependencies between them). Phase 3.4 depends on 3.2 + 3.3. Phase 3.5 depends on 3.1 + 3.4. Phase 3.6 depends on 3.4.

### styles.ts
Currently a single file (~1750 lines). Decision D14 calls for splitting into `styles/base.ts`, `styles/controls.ts`, `styles/sections.ts`, `styles/index.ts`. This is overdue — treat it as Phase 4 item 1. The combined export `hawkEyeStyles` must not change.

---

## UI / CSS Gotchas (added 2026-03-16)

### `backdrop-filter` breaks `position: fixed` children
`backdrop-filter` (non-`none`) on an ancestor creates a containing block for `position: fixed` descendants — children are positioned relative to that ancestor, not the viewport. The ColorPicker uses `position: fixed` for its popover. **Fix:** Move `backdrop-filter` to a `::before` pseudo-element with `position: absolute; inset: 0; z-index: -1`. The visual blur is identical, but fixed children escape correctly.

### CSS `[attr="val"]` is exact-match
`data-hawk-eye-ui="compact-row typo-weight-size"` will NOT match `[data-hawk-eye-ui="compact-row"]`. Use `[data-hawk-eye-ui~="val"]` for space-separated multi-value, or keep the attribute single-valued. All current `data-hawk-eye-ui` values are single tokens.

### `input-unit-label` token
A static muted unit suffix (`color: var(--he-label); font-size: 13px; letter-spacing: -0.25px`) used next to transparent number inputs inside a container pill. Used in `PerSideControl` and `DashGapCard`.

### PerSideControl pattern (as of 2026-03-16)
Renders `[All/Each <select>] [single-value pill OR 4-cell pill]`. Select uses `data-hawk-eye-ui="select-input"` with a `per-side-row > select-input` override for `max-width: 72px`. Each cell in "Each" mode is separated by `border-right: 1px solid #4c4c4c` with `:last-child { border-right: none }`. The inner `text-input` is transparent/borderless; the container provides the background.

### Color input pattern (as of 2026-03-16)
`color-row` is the styled container (`bg var(--he-input); border-radius: 8px; padding: 8px; border: 1px solid transparent`). Swatch is 16×16px inside. Inner `text-input` is transparent with no border. Dirty/invalid border states target `color-row`, not the inner input. An explicit override resets the inner input back to transparent when its parent `compact-card` is dirty.

## Last Updated
2026-03-17 (Phase 3.10 Size & Spacing redesign complete)
