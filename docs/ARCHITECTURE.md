# Hawk-Eye Architecture

## Current State

Hawk-Eye is currently a pre-alpha monorepo with three active workspace packages:

- `@hawk-eye/client`: React-facing runtime entrypoint
- `@hawk-eye/vite-plugin`: Vite integration point
- `hawk-eye-demo`: local validation app

Today, the client and plugin packages collaborate to provide a working Phase 1 inspector in Vite development mode.

## Runtime Boundaries

### Client package

The client package owns the browser-side UX. In the current state it owns:

- the floating trigger
- Shadow DOM overlay rendering
- hover tracking and click-to-lock selection
- source-info display
- HMR bridge calls back to the Vite plugin

In later phases it will also own:

- property editing UI

### Vite plugin

The Vite plugin owns dev-server integration. In the current state it owns:

- intrinsic JSX source injection
- source-token validation
- selection payload replies over the Vite HMR channel

In later phases it will also own:

- style detection
- source-file mutation and HMR refresh

### Demo app

The demo app is the integration harness. It proves that the local packages install, build, and run together inside a React + Vite + Tailwind environment.

## Build and Verification

- pnpm workspaces manage local package linking
- tsup builds the library packages as ESM + CJS
- Vite builds and serves the demo app
- ESLint and TypeScript provide static validation
- Vitest provides a minimal smoke-test baseline

## Next Architectural Step

Phase 2 adds the next architectural layer:

1. derive editable visual properties from the selected element
2. render property controls and live preview state in the client runtime
3. preserve the current inspector bridge as the selection foundation for later writers
