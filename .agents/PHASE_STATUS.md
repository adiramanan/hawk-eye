# Phase Progress Tracker

## Phase 0: Repository Setup & Configuration

**Status:** IN PROGRESS (60% complete)
**Start Date:** 2025-03-07
**Target Completion:** 2025-03-07

### Checklist
- [x] Plan architecture and structure
- [x] Create agent memory system (.agents/)
- [ ] Create directory structure (packages/, demo/, docs/)
- [ ] Create root package.json with workspace config
- [ ] Create pnpm-workspace.yaml
- [ ] Create TypeScript config (tsconfig.json, individual configs per package)
- [ ] Create ESLint + Prettier config
- [ ] Create .nvmrc, .pnpmrc, .gitignore
- [ ] Create package.json for @hawk-eye/client
- [ ] Create package.json for @hawk-eye/vite-plugin
- [ ] Create package.json for hawk-eye-demo
- [ ] Create build configs (tsup.config.ts, vite.config.ts)
- [ ] Create initial source scaffolds (empty src/ dirs)
- [ ] Create README.md, CONTRIBUTING.md, docs/
- [ ] Run `pnpm install` and verify
- [ ] Create git commit

**Blockers:** None

**Dependencies:** None (Phase 0 is foundational)

**Next Phase Gate:** Phase 1 begins after Setup is 100% complete

---

## Phase 1: Inspector Overlay & Source Injection

**Status:** NOT STARTED
**Start Date:** TBD (after Phase 0 complete)
**Target Duration:** 1.5–2 weeks
**Target Completion:** TBD

### Overview
Foundation layer: Get elements selected in the browser and mapped to source code.

### Key Deliverables
1. Babel transform that injects data-source attributes
2. Floating trigger icon for activating inspector mode
3. Hover overlay with bounding box + dimensions
4. Click-to-select with WebSocket bridge to Vite plugin
5. Source context retrieval (file path, line number, styling approach)

### Checklist
- [ ] Implement source-injector.ts (Babel transform)
- [ ] Implement DesignTool.tsx (trigger icon component)
- [ ] Implement Inspector.tsx (hover/click logic)
- [ ] Implement ws-client.ts (WebSocket communication)
- [ ] Implement ws-server.ts in Vite plugin
- [ ] Create Shadow DOM isolation for overlay
- [ ] Add bounding box + dimension rendering
- [ ] Test element selection across various JSX patterns
- [ ] Create Phase 1 demo video
- [ ] Write Phase 1 documentation

**Blockers:** None

**Success Criteria:**
- Click any element → see bounding box + file path + line number
- Overlay doesn't break page styles
- WebSocket connection established and stable
- Works with common JSX patterns (className, style, etc.)

**Next Phase Gate:** Phase 2 begins after Inspector is fully functional

---

## Phase 2: Properties Panel & Live Preview

**Status:** NOT STARTED
**Start Date:** TBD (after Phase 1 complete)
**Target Duration:** 1.5–2 weeks
**Target Completion:** TBD

### Overview
Core design experience: See and edit visual properties with instant feedback.

### Key Deliverables
1. Properties panel UI with Figma-style controls
2. Property reading (getComputedStyle + className parsing)
3. Live DOM preview (element.style overrides)
4. Change accumulator with undo/redo
5. Token-aware controls (Tailwind scale suggestions)

### Checklist
- [ ] Create PropertiesPanel.tsx component
- [ ] Build property controls (numeric, color, dropdown)
- [ ] Implement box model diagram (spacing)
- [ ] Create token selector (Tailwind scale)
- [ ] Implement change accumulator (ChangeAccumulator.ts)
- [ ] Add undo/redo support
- [ ] Build "Changes" badge + review interface
- [ ] Test live preview across property types
- [ ] Create Phase 2 demo video

**Blockers:** None

**Success Criteria:**
- Select element → properties populate correctly
- Edit property → instant visual feedback (< 100ms)
- Undo/redo works smoothly
- Token selector shows appropriate scale values

**Next Phase Gate:** Phase 3 begins after Properties Panel is functional

---

## Phase 3: Code Writers & Apply to Source

**Status:** NOT STARTED
**Start Date:** TBD (after Phase 2 complete)
**Target Duration:** 1.5–2 weeks
**Target Completion:** TBD

### Overview
Magic moment: Design changes become real code in source files.

### Key Deliverables
1. Style detector (Tailwind vs inline vs unsupported)
2. Tailwind writer (token swap + arbitrary values)
3. Inline style writer (AST-based mutation via ts-morph)
4. Diff generator (show changes before writing)
5. File writer (write to source, trigger HMR)

### Checklist
- [ ] Implement style-detector.ts
- [ ] Build tailwind-writer.ts (token mapping + swap)
- [ ] Build inline-writer.ts (ts-morph AST mutation)
- [ ] Implement diff-generator.ts
- [ ] Build DiffView.tsx (change review UI)
- [ ] Implement file writing + HMR trigger
- [ ] Test code output cleanliness (no artifacts)
- [ ] Test edge cases (conditional classes, etc.)
- [ ] Create Phase 3 demo video

**Blockers:** None (known limitations documented in BLOCKERS.md)

**Success Criteria:**
- Changes apply cleanly (indistinguishable from hand-written code)
- Diff is accurate
- File writes don't break syntax
- HMR reloads page with real code changes
- Generates output < 2 seconds from "Apply" click

**Next Phase Gate:** Phase 4 begins after Code Writers are functional

---

## Phase 4: Polish, Docs & Public Release

**Status:** NOT STARTED
**Start Date:** TBD (after Phase 3 complete)
**Target Duration:** 1 week
**Target Completion:** TBD

### Overview
Make it robust and ready for public release.

### Key Deliverables
1. Edge case handling (conditional classNames, dynamic styles, etc.)
2. Error boundaries and graceful fallbacks
3. Complete documentation (setup, usage, architecture)
4. Demo app refinement
5. README + contribution guide
6. Open-source setup (license, repo, npm publish)

### Checklist
- [ ] Handle clsx/cn conditional patterns
- [ ] Add error boundaries
- [ ] Test with various React/Vite setups
- [ ] Write installation guide
- [ ] Write usage guide
- [ ] Write architecture overview
- [ ] Create demo video (full workflow)
- [ ] Set up MIT license
- [ ] Publish npm packages (@hawk-eye/client, @hawk-eye/vite-plugin)
- [ ] Create GitHub repo
- [ ] Write issue templates

**Blockers:** None

**Success Criteria:**
- MVP spec success criteria met (see spec section 11)
- Public GitHub repo active
- npm packages published
- Documentation complete
- Zero show-stopper bugs

---

## Post-MVP Roadmap

### v0.2: CSS Modules Support
- CSS Modules writer
- Cross-file import resolution
- Targets Designer-in-Dev-Team persona

### v0.3: Direct Canvas Manipulation
- Drag handles for padding/margin
- Drag-to-reposition within containers
- Spacing guides

### v0.4: Component Tree
- Navigable component hierarchy
- Click-to-select in tree
- Search components

### v0.5: Responsive Editing
- Breakpoint-aware editing
- Show responsive variants (md:, lg:)
- Viewport width toggle

### v0.6: Git Integration
- Built-in version snapshots
- Visual change timeline
- Auto-commit on apply

### v0.7: Zero-Config CLI
- Auto-detect framework, build tool, styling
- One-command setup

### v0.8: Multi-Framework
- Vue 3 support
- Svelte support

### v1.0: Full Design Tool Parity
- Text editing on canvas
- Image replacement
- Animation/transition editing
- Multi-select
- Design tokens export

---

## Overall Timeline
- Phase 0: 1 day (setup)
- Phase 1: 1.5–2 weeks
- Phase 2: 1.5–2 weeks
- Phase 3: 1.5–2 weeks
- Phase 4: 1 week
- **Total MVP:** 5–7 weeks full-time, 8–12 weeks part-time

Current: 2025-03-07 (Phase 0 in progress)
