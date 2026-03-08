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
├── DesignTool.tsx         # Root component (trigger icon)
├── Inspector.tsx          # Hover/click overlay
├── PropertiesPanel.tsx    # Right-side panel
├── DiffView.tsx           # Change review UI
├── controls/              # Reusable property controls
├── ChangeAccumulator.ts   # State management for edits
├── ws-client.ts           # WebSocket client
├── tailwind-map.ts        # CSS ↔ Tailwind token mapping
└── styles/                # CSS injected into Shadow DOM

packages/vite-plugin/src/
├── index.ts               # Plugin entry
├── source-injector.ts     # Babel transform
├── style-detector.ts      # Determine Tailwind vs inline
├── writers/               # Code mutation logic
├── diff-generator.ts      # Compute diffs
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
- `@hawk-eye/client` currently exports a placeholder `DesignTool` button only.
- `@hawk-eye/vite-plugin` currently exports a serve-only plugin shell.
- The demo app verifies package wiring, not end-user inspector functionality.

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

- **Phase 1 (Inspector):** NOT STARTED
  - Babel source injection
  - Hover overlay + element selection
  - WebSocket bridge to Vite plugin

- **Phase 2 (Properties Panel):** NOT STARTED
  - Properties UI controls
  - Live preview (DOM style overrides)
  - Change accumulator

- **Phase 3 (Code Writers):** NOT STARTED
  - Tailwind writer (token swap)
  - Inline style writer (AST mutation)
  - File writing + HMR

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

## Last Updated
2026-03-07 (Phase 0 closeout)
