# Hawk-Eye Architecture

## Current State

Hawk-Eye is currently a pre-alpha monorepo with three active workspace packages:

- `@hawk-eye/client`: React-facing runtime entrypoint
- `@hawk-eye/vite-plugin`: Vite integration point
- `hawk-eye-demo`: local validation app

Today, the client and plugin packages are intentionally thin shells. Their purpose in Phase 0 is to validate package wiring, build output, and local development flow.

## Runtime Boundaries

### Client package

The client package owns the browser-side UX. In the current scaffold, that is a placeholder `DesignTool` component. In later phases it will own:

- inspector activation
- overlay rendering
- property editing UI
- communication with the Vite plugin

### Vite plugin

The Vite plugin owns dev-server integration. In the current scaffold, it exports a serve-only plugin shell. In later phases it will own:

- source metadata injection
- browser-to-server communication
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

Phase 1 adds the first real cross-boundary behavior:

1. inject source metadata during Vite transforms
2. surface inspector state in the client runtime
3. connect both sides through a low-latency dev-server bridge
