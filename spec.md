# Hawk-Eye Specification

## Product Intent

Hawk-Eye aims to let designers and AI prototypers refine React interfaces visually while preserving source-code ownership. The design panel aspires to Framer/WordPress-level fidelity with rich controls, collapsible sections, and comprehensive CSS property coverage.

## Current Scope

The repository is in pre-alpha and has completed the prerelease hardening pass for the public `hawk-eye` package.

Implemented:

- workspace/package scaffolding
- demo app wiring
- single-package public install surface with `.` and `./vite` exports
- build, lint, type-check, and test commands
- agent handoff and project tracking files
- dev-only signed source injection for intrinsic JSX elements
- inspector trigger, hover overlay, click-to-lock selection, and repo-relative source display
- guided property controls for spacing, radius, colors, typography, and opacity
- live DOM preview with session-scoped pending changes and reset controls

Not implemented:

- Framer-level design panel with rich controls (color picker, per-side, selects, segmented, toggles)
- comprehensive CSS property coverage (60-80 properties across 10+ groups)
- collapsible section system
- style-strategy-specific source mutation
- writing changes back to source files
- durable diff/apply workflows

## Phase Plan

### Phase 0: Setup (COMPLETE)

- establish workspace structure
- configure tooling
- provide truthful documentation
- add a minimal verification baseline

### Phase 1: Inspector (COMPLETE)

- inject source metadata into JSX
- activate inspector mode from the client runtime
- select live elements and resolve source context

### Phase 2: Properties (COMPLETE — base)

- read visual properties
- support live preview edits
- accumulate and review pending changes

### Phase 2.1: Foundation — Type System & Property Definitions

- expand `EditablePropertyControl` to support rich control types (number, slider, color, select, segmented, toggle, per-side)
- add optional metadata fields to property definitions (options, min/max/step, units, sides, tailwindPrefix)
- grow property definitions from 15 to 60-80 across 10 groups
- add color parsing and CSS value parsing utilities

### Phase 2.2: Primitive Control Components

- build NumberInput, SliderInput, ColorInput, SelectInput, SegmentedControl, ToggleSwitch, PerSideControl
- split styles.ts into modular files (base, controls, sections)
- all controls render inside Shadow DOM

### Phase 2.3: Collapsible Sections & Panel Refactor

- build CollapsibleSection wrapper with chevron toggle and optional action buttons
- refactor PropertiesPanel from flat grid to section-based architecture
- add renderControl dispatcher that switches on control type

### Phase 2.4: High-Priority Sections (Milestone 1)

- Spacing: per-side controls for padding and margin (replaces 8 text inputs)
- Fill/Appearance: color picker for bg/text, opacity slider, corner radius per-side
- Typography: font family select, letter-spacing, text-align segmented, text-decoration, text-transform
- Size: width/height with unit selectors, min/max constraints
- Layout: display, position type, overflow, z-index selects

### Phase 2.5: Advanced Sections (Milestone 2)

- Stroke/Border: color picker, border-style select, width per-side
- Effects: box-shadow editor, text-shadow, filter controls
- Position: alignment, top/right/bottom/left, z-index
- Auto Layout: flex direction segmented, gap, alignment, clip content toggle

### Phase 2.6: Panel Polish

- section dividers and visual hierarchy
- property search bar
- keyboard navigation
- panel resize handle

### Phase 3: Writers (parallel with Phase 2.4+)

- detect supported styling strategies
- Tailwind writer (token swap using tailwindPrefix metadata)
- inline style writer (AST mutation via ts-morph)
- diff generation and review UI
- file persistence and HMR refresh

### Phase 4: Polish

- harden edge cases
- complete docs
- prepare open-source release

### Prerelease Packaging

- publish one installable package under `hawk-eye`
- keep the internal client/plugin split
- keep save opt-in through `hawkeyePlugin({ enableSave: true })`

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

Phase 2 (base) is complete when:

- locking a selection opens a properties panel with grouped visual controls
- spacing, radius, colors, typography, and opacity can be previewed live in the browser
- pending preview changes persist across selection switches during the active inspector session
- per-field reset, global reset, and inspector exit all restore the live DOM to its baseline state
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass with the live preview implementation in place

## Phase 2.1 Acceptance Criteria

Phase 2.1 is complete when:

- `EditablePropertyControl` supports at least: text, number, slider, color, select, segmented, toggle, per-side
- property definitions cover 60+ CSS properties across 10 groups (position, autoLayout, size, spacing, appearance, fill, stroke, typography, effects, layout)
- color parsing utilities handle hex, rgb(), rgba(), hsl(), hsla(), and named colors
- CSS value parsing can extract number + unit from values like "16px", "1.5rem", "50%"
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass

## Phase 2.2 Acceptance Criteria

Phase 2.2 is complete when:

- NumberInput, SliderInput, ColorInput, SelectInput, SegmentedControl, ToggleSwitch, and PerSideControl components exist and render inside Shadow DOM
- styles are split into modular files with a single combined export
- each control accepts value/onChange props compatible with the draft system
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass

## Phase 2.3 Acceptance Criteria

Phase 2.3 is complete when:

- property groups render inside collapsible sections with expand/collapse toggle
- the PropertiesPanel uses a control type dispatcher instead of hardcoded text inputs
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass

## Phase 2.4 Acceptance Criteria

Phase 2.4 is complete when:

- spacing uses PerSideControl for padding and margin
- color properties use ColorInput with swatch, hex, and opacity
- typography includes font family, letter-spacing, text-align, text-decoration, text-transform
- size section shows width/height with unit selectors
- layout section includes display, position, overflow, z-index
- all new controls integrate with the live preview draft system
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass

## Phase 2.5 Acceptance Criteria

Phase 2.5 is complete when:

- stroke/border section supports color, style, and width per-side
- effects section supports box-shadow editing
- position section includes top/right/bottom/left controls
- auto layout section includes flex direction, gap, and alignment controls
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass

## Phase 2.6 Acceptance Criteria

Phase 2.6 is complete when:

- sections have clear visual dividers and hierarchy
- a property search bar filters visible controls
- keyboard navigation works across all control types
- `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm build` pass
