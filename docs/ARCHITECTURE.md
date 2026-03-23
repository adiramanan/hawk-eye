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
- style-strategy detection and source mutation for supported writes
- selection payload replies over the Vite HMR channel
- source-file mutation and HMR refresh

### Demo app

The demo app is the integration harness. It proves that the local packages install, build, and run together inside a React + Vite + Tailwind environment, and it resolves the public `hawk-eye` package output from the workspace build.

## Build and Verification

- pnpm workspaces manage local package linking
- the public `hawk-eye` package re-exports the internal runtime and plugin entrypoints
- tsup builds the library packages
- Vite builds and serves the demo app
- ESLint and TypeScript provide static validation
- Vitest covers source injection, bridge handling, and the client runtime

## Next Architectural Step

The next architectural step is hardening the source-writer layer:

1. improve structural rewrites for fully dynamic `className` and `style` expressions
2. add diff/review UX for source writes before persistence
3. expand source mutation coverage and recovery paths
