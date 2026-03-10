# Hawk-Eye Specification

## Product Intent

Hawk-Eye aims to let designers and AI prototypers refine React interfaces visually while preserving source-code ownership.

## Current Scope

The repository is in pre-alpha and has completed Phase 2.

Implemented:

- workspace/package scaffolding
- demo app wiring
- build, lint, type-check, and test commands
- agent handoff and project tracking files
- dev-only source injection for intrinsic JSX elements
- inspector trigger, hover overlay, click-to-lock selection, and repo-relative source display
- guided property controls for spacing, radius, colors, typography, and opacity
- live DOM preview with session-scoped pending changes and reset controls

Not implemented:

- style-strategy-specific source mutation
- writing changes back to source files
- durable diff/apply workflows

## Phase Plan

### Phase 0: Setup

- establish workspace structure
- configure tooling
- provide truthful documentation
- add a minimal verification baseline

### Phase 1: Inspector

- inject source metadata into JSX
- activate inspector mode from the client runtime
- select live elements and resolve source context

### Phase 2: Properties

- read visual properties
- support live preview edits
- accumulate and review pending changes

### Phase 3: Writers

- detect supported styling strategies
- mutate source code safely
- write changes and trigger reloads

### Phase 4: Polish

- harden edge cases
- complete docs
- prepare open-source release

## Phase 0 Acceptance Criteria

Phase 0 is complete when:

- `pnpm install` works in a clean checkout
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass
- README and contributor docs describe the current scaffold truthfully
- package entrypoints do not reference missing artifacts
- the repo contains a standard open-source license

## Phase 1 Acceptance Criteria

Phase 1 is complete when:

- Vite dev transforms inject source metadata into intrinsic JSX elements
- the client runtime can toggle inspector mode, hover elements, and lock selection on click
- the overlay displays repo-relative `file:line:column` source info
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass with the inspector implementation in place

## Phase 2 Acceptance Criteria

Phase 2 is complete when:

- locking a selection opens a properties panel with grouped visual controls
- spacing, radius, colors, typography, and opacity can be previewed live in the browser
- pending preview changes persist across selection switches during the active inspector session
- per-field reset, global reset, and inspector exit all restore the live DOM to its baseline state
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass with the live preview implementation in place
