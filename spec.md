# Hawk-Eye Specification

## Product Intent

Hawk-Eye aims to let designers and AI prototypers refine React interfaces visually while preserving source-code ownership.

## Current Scope

The repository is in pre-alpha and has completed Phase 0 only.

Implemented:

- workspace/package scaffolding
- demo app wiring
- build, lint, type-check, and smoke-test commands
- agent handoff and project tracking files

Not implemented:

- source-to-element mapping
- inspector overlays
- property editing
- writing changes back to source files

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
