# Hawk-Eye Architecture

## Current State

Hawk-Eye is currently a pre-alpha monorepo with one public install target and two internal implementation packages:

- `hawk-eye`: public runtime and Vite plugin export surface
- `@hawk-eye/client`: internal React-facing runtime package
- `@hawk-eye/vite-plugin`: internal Vite integration package
- `hawk-eye-demo`: local validation app

Today, the internal client and plugin packages collaborate to provide a working inspector and live-preview editor in Vite development mode.

## Runtime Boundaries

### Client package

The client package owns the browser-side UX. In the current state it owns:

- the floating trigger
- Shadow DOM overlay rendering
- hover tracking and click-to-lock selection
- source-info display
- grouped property controls for the locked selection
- session-scoped draft state for live preview edits
- DOM-only inline preview overrides and reset behavior
- HMR bridge calls back to the Vite plugin

### Vite plugin

The Vite plugin owns dev-server integration. In the current state it owns:

- intrinsic JSX source injection with signed `data-hawk-eye-source` metadata
- source-token validation
- selection payload replies over the Vite HMR channel

In later phases it will also own:

- style-strategy detection
- source-file mutation and HMR refresh

### Demo app

The demo app is the integration harness. It proves that the local packages install, build, and run together inside a React + Vite + Tailwind environment.

## Build and Verification

- pnpm workspaces manage local package linking
- the public `hawk-eye` package re-exports the internal runtime and plugin entrypoints
- tsup builds the library packages
- Vite builds and serves the demo app
- ESLint and TypeScript provide static validation
- Vitest covers source injection, bridge handling, and the client runtime

## Next Architectural Step

Phase 3 adds the source-writer layer:

1. detect the styling strategy behind the selected element
2. translate pending preview changes into source-level mutations
3. write changes safely and trigger the appropriate Vite refresh path
