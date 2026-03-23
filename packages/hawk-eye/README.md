# hawk-eye

Public runtime and Vite plugin entrypoints for Hawk-Eye.

## Install

```bash
pnpm add -D hawk-eye
```

## Zero-Step Setup

```ts
pnpm hawk-eye init
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
  plugins: [hawkeyePlugin(), react()],
});
```

Manual integration still works if you prefer explicit control over the mount point.

## Validation

Run the root package validation command before publishing:

```bash
pnpm package:check
```
