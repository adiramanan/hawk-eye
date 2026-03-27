# hawk-eye

Public runtime, Vite plugin, and CLI entrypoints for Hawk-Eye.

## Install

```bash
pnpm add -D hawk-eye
```

## Zero-Step Setup

```bash
pnpm exec hawk-eye init
```

The installer patches a supported React + Vite app by:

- adding `hawkeyePlugin()` to the Vite config before `react()`
- adding `DesignTool` to the app root render tree
- guarding the mounted UI behind `import.meta.env.DEV`

After that, starting the app in development shows the floating Hawk-Eye trigger automatically.

## Manual Setup

```ts
import { DesignTool } from 'hawk-eye';
import hawkeyePlugin from 'hawk-eye/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [hawkeyePlugin({ enableSave: true }), react()],
});
```

```tsx
import { DesignTool } from 'hawk-eye';

export function AppShell() {
  return (
    <>
      {import.meta.env.DEV ? <DesignTool /> : null}
      {/* app content */}
    </>
  );
}
```

`hawkeyePlugin()` must run before `react()` so Hawk-Eye can preserve source coordinates correctly.

## Scope

The visual inspector and source write-back flow currently target React + Vite projects. The package also ships `hawk-eye/vue` and `hawk-eye/svelte` store adapters, but those are not a full inspector integration.

## Validation

Run the root package validation command before publishing:

```bash
pnpm package:check
```
