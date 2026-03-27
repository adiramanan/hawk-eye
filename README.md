# Hawk-Eye

Hawk-Eye is a development-time visual inspector for React + Vite. It overlays a running app, lets you inspect real DOM nodes, preview style edits live, and optionally write supported changes back to source.

## Release Surface

The published `hawk-eye` package currently exposes:

- `hawk-eye` for the React `DesignTool` component
- `hawk-eye/vite` for the Vite dev plugin
- `hawk-eye/vue` for Vue store adapters
- `hawk-eye/svelte` for Svelte store adapters
- `hawk-eye` CLI with `init` for React + Vite apps

The visual inspector and source-mutation flow are currently built for React + Vite projects. The Vue and Svelte entrypoints expose store adapters only; they are not a full visual-inspector integration.

## Install

```bash
pnpm add -D hawk-eye
```

## Quick Start

### Automatic Setup

```bash
pnpm exec hawk-eye init
```

The installer patches a supported React + Vite app by:

- adding `hawkeyePlugin()` before `react()` in `vite.config.*`
- adding `DesignTool` to the app root render tree
- guarding the mounted UI behind `import.meta.env.DEV`

### Manual Setup

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import hawkeyePlugin from 'hawk-eye/vite';

export default defineConfig({
  plugins: [hawkeyePlugin({ enableSave: true }), react()],
});
```

```tsx
import { DesignTool } from 'hawk-eye';

export default function App() {
  return (
    <>
      {import.meta.env.DEV ? <DesignTool /> : null}
      {/* app content */}
    </>
  );
}
```

`hawkeyePlugin()` must run before `react()` so Hawk-Eye can preserve source coordinates correctly.

## Vite Plugin

```ts
import hawkeyePlugin from 'hawk-eye/vite';

hawkeyePlugin({
  enableSave: true,
});
```

When enabled, the plugin:

- injects `data-hawk-eye-source` metadata into JSX and TSX elements during dev
- exposes inspect and style-analysis events over the Vite HMR channel
- enables save/write-back for supported Tailwind and inline-style edits when `enableSave: true`

## Vue And Svelte Adapters

Vue and Svelte entrypoints are available for shared store access:

```ts
import { useHawkEyeState, useHawkEyeSelector, useHawkEyeDispatch } from 'hawk-eye/vue';
import { hawkEyeStore, hawkEyeDispatch, createHawkEyeReadable } from 'hawk-eye/svelte';
```

These adapters do not currently replace the React inspector UI.

## CLI

```bash
pnpm exec hawk-eye init
```

Supported target:

- React + Vite entry files in `src/main.tsx`, `src/main.jsx`, `src/index.tsx`, or `src/index.jsx`

## Validate Before Publishing

```bash
pnpm build
pnpm type-check
pnpm test
pnpm lint
```

## Workspace

- Public package: [`packages/hawk-eye`](./packages/hawk-eye)
- React client runtime: [`packages/client`](./packages/client)
- Vite integration: [`packages/vite-plugin`](./packages/vite-plugin)
- Shared protocol: [`shared`](./shared)

```
hawk-eye          → React runtime (DesignTool, store hooks, schema)
hawk-eye/vite     → Vite plugin
hawk-eye/vue      → Vue 3 composables + plugin
hawk-eye/svelte   → Svelte store adapters
```

All framework adapters are optional peer dependencies — only the framework you use gets bundled.

---

## Agent Memory

This repo uses a file-native memory protocol under [`.memory/`](./.memory/). No bootstrap command is required for day-to-day memory handling. Agents work directly with `.memory/sessions/`, `.memory/notes/`, and `.memory/receipts.jsonl`. Bridge files (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`) point to [AGENTS.md](./AGENTS.md). `pnpm memory:migrate` and `pnpm memory:doctor` remain available as optional helper tooling.

---

## Contributing

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm test             # Run tests (must pass)
pnpm build            # Build all packages (must pass)
pnpm token-audit      # Check design token compliance
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

---

## License

MIT. See [LICENSE](./LICENSE).
