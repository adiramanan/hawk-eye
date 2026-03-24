# Hawk-Eye

Visual design tool for inspecting and refining AI-generated interfaces in real time.

> Use AI to generate UI. Use Hawk-Eye to inspect and refine it — live, in the browser.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-124%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)]()

---

## What is Hawk-Eye?

Hawk-Eye is a development-time visual inspector that overlays your running app. Click any element to inspect it, edit its CSS properties live in the browser, and write changes back to source. It works with React, Vue, and Svelte — anywhere Vite runs.

**Key capabilities:**
- **Visual inspection** — Hover to outline, click to lock selection, view source metadata
- **Live property editing** — 15 focused CSS properties with specialized controls
- **Source write-back** — Edits written to Tailwind classes, inline styles, or mixed mode via AST
- **Session-scoped previews** — Changes survive element switching, reset per-field or globally

---

## Quick Start

### Automatic Setup (React + Vite)

```bash
pnpm add -D hawk-eye
pnpm hawk-eye init
```

The installer patches your Vite config and app entry automatically.

### Manual Setup (React + Vite)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import hawkeyePlugin from 'hawk-eye/vite';

export default defineConfig({
  plugins: [
    react(),
    hawkeyePlugin({ enableSave: true }),
  ],
});
```

```tsx
// App.tsx
import { DesignTool } from 'hawk-eye';

export default function App() {
  return (
    <>
      <DesignTool />
      {/* Your app content */}
    </>
  );
}
```

### Vue 3 + Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import hawkeyePlugin from 'hawk-eye/vite';

export default defineConfig({
  plugins: [vue(), hawkeyePlugin({ enableSave: true })],
});
```

```vue
<!-- App.vue -->
<script setup>
import { useHawkEyeState, useHawkEyeSelector, useHawkEyeDispatch } from 'hawk-eye/vue';

const state = useHawkEyeState();                         // Ref<HawkEyeState>
const enabled = useHawkEyeSelector(s => s.enabled);      // ComputedRef<boolean>
const dispatch = useHawkEyeDispatch();
</script>

<template>
  <div>
    <p>Inspector: {{ enabled ? 'ON' : 'OFF' }}</p>
    <button @click="dispatch({ type: 'SET_ENABLED', payload: !enabled })">
      Toggle
    </button>
  </div>
</template>
```

Or use the Vue plugin for app-wide state:

```ts
// main.ts
import { createApp } from 'vue';
import { HawkEyeVuePlugin } from 'hawk-eye/vue';
import App from './App.vue';

const app = createApp(App);
app.use(HawkEyeVuePlugin, { enableLogging: true });
app.mount('#app');
```

### Svelte + Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import hawkeyePlugin from 'hawk-eye/vite';

export default defineConfig({
  plugins: [svelte(), hawkeyePlugin({ enableSave: true })],
});
```

```svelte
<!-- App.svelte -->
<script>
  import { hawkEyeStore, hawkEyeDispatch, createHawkEyeReadable } from 'hawk-eye/svelte';

  // Auto-subscribe with $ prefix
  const enabled = createHawkEyeReadable(s => s.enabled);

  function toggle() {
    hawkEyeDispatch({ type: 'SET_ENABLED', payload: !$enabled });
  }
</script>

<p>Inspector: {$enabled ? 'ON' : 'OFF'}</p>
<button on:click={toggle}>Toggle</button>
```

Initialize the store once at app startup:

```ts
// main.ts
import { initHawkEyeStore } from 'hawk-eye/svelte';
initHawkEyeStore({ enableLogging: true });
```

---

## Controls

Hawk-Eye ships 16 specialized controls for CSS property editing:

| Control | Description | Properties |
|---------|-------------|------------|
| `NumberInput` | Numeric value with scrubbing, math expressions, unit conversion | Any numeric CSS value |
| `ColorPicker` | HSV color picker with hex/alpha inputs | `color`, `background-color`, `border-color` |
| `ColorInput` | Inline color swatch + text input | Color properties |
| `FillInput` | Solid color, gradient, or image fill | `background` |
| `GradientEditor` | Visual gradient stop editor | `background-image` |
| `ImageFillEditor` | Background image with size/position | `background-image`, `background-size` |
| `SliderInput` | Range slider with numeric readout | `opacity`, `font-weight` |
| `SelectInput` | Dropdown select for keyword values | `display`, `position`, `overflow` |
| `ToggleSwitch` | Boolean toggle | `visibility`, `pointer-events` |
| `TextInput` | Free-text input | `font-family`, custom values |
| `SizeInput` | Width/height with mode switching (fixed, hug, fill) | `width`, `height` |
| `PerSideControl` | Four-side editor with linked/unlinked mode | `padding`, `margin` |
| `PerCornerControl` | Four-corner editor with linked/unlinked mode | `border-radius` |
| `BoxShadowInput` | Multi-value shadow editor | `box-shadow` |
| `GridTrackEditor` | CSS Grid track definition editor | `grid-template-columns/rows` |
| `SegmentedControl` | Segmented button group | Enum-like properties |

### Composable Primitives

Controls are built from reusable primitives (7 available):

```ts
import {
  NumericInput,    // Pure numeric parsing + validation + keyboard nav
  ScrubLabel,      // Drag-to-scrub behavior for any label
  UnitSelector,    // Unit dropdown (px, em, rem, %, vw, vh)
  ColorGradient,   // Gradient stop editor
  HSVSlider,       // Hue / Saturation / Value sliders
  OptionInput,     // Dropdown or segmented control
  TextInput,       // Base text input wrapper
} from '@hawk-eye/client/controls/primitives';
```

---

## Store API

Hawk-Eye uses a centralized, framework-agnostic store with pure reducers and middleware.

### Framework-Agnostic Core

```ts
import { createHawkEyeStore } from 'hawk-eye';

const store = createHawkEyeStore();

// Read state
store.getState();                          // HawkEyeState
store.getState().enabled;                  // boolean
store.getState().drafts;                   // Record<string, SelectionDraft>

// Dispatch actions
store.dispatch({ type: 'SET_ENABLED', payload: true });
store.dispatch({ type: 'SET_SHELL_STATE', payload: 'open' });

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state.enabled);
});
unsubscribe(); // Clean up
```

### State Shape

```ts
interface HawkEyeState {
  enabled: boolean;
  portalRoot: HTMLElement | null;
  prefersReducedMotion: boolean;
  shellState: 'closed' | 'open' | 'minimized';
  selected: MeasuredElement | null;
  selectedInstanceKey: string | null;
  hovered: MeasuredElement | null;
  drafts: Record<string, SelectionDraft>;
  savePending: boolean;
  saveResult: SaveResult | null;
}
```

### Actions (14 types)

| Action | Payload | Description |
|--------|---------|-------------|
| `SET_ENABLED` | `boolean` | Enable/disable inspector |
| `SET_HOVERED` | `MeasuredElement \| null` | Set hovered element |
| `SET_SELECTED` | `{ element, key }` | Set selected element |
| `SET_SELECTED_INSTANCE_KEY` | `string \| null` | Set selected instance key |
| `SET_SHELL_STATE` | `InspectorShellState` | Panel open/closed/minimized |
| `SET_PREFERS_REDUCED_MOTION` | `boolean` | Motion preference |
| `UPDATE_DRAFT` | `{ key, draft }` | Update a single draft |
| `SET_DRAFTS` | `Record<string, SelectionDraft>` | Replace all drafts |
| `DELETE_DRAFT` | `string` | Remove a draft by key |
| `CLEAR_DRAFTS` | — | Clear all drafts |
| `SET_SAVE_PENDING` | `boolean` | Save in progress |
| `SET_SAVE_RESULT` | `SaveResult \| null` | Save result |
| `INIT_PORTAL` | `HTMLElement` | Initialize portal root |
| `UPDATE_DRAFTS_BULK` | `Record<string, SelectionDraft>` | Bulk draft update |

### React Hooks

```ts
import {
  useHawkEyeState,      // Full state (re-renders on any change)
  useHawkEyeSelector,   // Selected slice (re-renders only when slice changes)
  useHawkEyeDispatch,   // Dispatch function
  useHawkEyeReducer,    // [selector result, dispatch] tuple
} from 'hawk-eye';
```

### Vue 3 Composables

```ts
import {
  useHawkEyeState,      // Readonly<ShallowRef<HawkEyeState>>
  useHawkEyeSelector,   // ComputedRef<T>
  useHawkEyeDispatch,   // (action: StoreAction) => void
  useHawkEyeReducer,    // [ComputedRef<T>, dispatch]
  HawkEyeVuePlugin,     // Vue plugin for app.use()
  useStore,              // Inject store from plugin
} from 'hawk-eye/vue';
```

### Svelte Stores

```ts
import {
  hawkEyeStore,          // SvelteReadable<HawkEyeState> — use as $hawkEyeStore
  hawkEyeDispatch,       // (action: StoreAction) => void
  createHawkEyeReadable, // Derived store with selector
  initHawkEyeStore,      // Initialize with middleware
} from 'hawk-eye/svelte';
```

---

## Schema & Validation

Type-safe property validation and design token enforcement:

```ts
import {
  propertySchemaRegistry,   // PropertySchemaRegistry instance
  validators,               // Built-in validators (pixels, color, keyword, any)
  tokenValidator,           // Design token validator
  getToken,                 // Type-safe token resolution
} from 'hawk-eye';

import type {
  PropertySchema,
  ColorToken,       // 'color-accent' | 'color-text-primary' | ...
  SpacingToken,     // 'spacing-xs' | 'spacing-sm' | ...
  ShadowToken,      // 'shadow-sm' | 'shadow-md' | ...
  RadiusToken,      // 'radius-xs' | 'radius-sm' | ...
} from 'hawk-eye';
```

---

## Plugin System

Extend Hawk-Eye with custom writers, analyzers, and middleware:

```ts
import { PluginRegistry, HAWK_EYE_EVENTS } from '@hawk-eye/vite-plugin';

const registry = new PluginRegistry();

registry.register({
  name: 'my-plugin',
  version: '1.0.0',
  execute(event, data) {
    if (event === HAWK_EYE_EVENTS.PROPERTY_CHANGE) {
      console.log('Property changed:', data);
    }
  },
});

// Listen for specific events
registry.on(HAWK_EYE_EVENTS.AFTER_SAVE, (data) => {
  console.log('Save completed:', data);
});
```

**Built-in events:** `style:analysis`, `property:change`, `save:before`, `save:after`, `error`

---

## Vite Plugin Configuration

```ts
import hawkeyePlugin from 'hawk-eye/vite';

hawkeyePlugin({
  enableSave: true,    // Enable source write-back (default: false)
});
```

The plugin:
- Injects `data-hawk-eye-source` metadata onto JSX elements during dev
- Provides AST-backed style strategy detection over the HMR channel
- Supports Tailwind class mapping, inline style writes, and mixed-mode fallback
- Handles detached write flow for converting Tailwind to inline preview

---

## CLI

```bash
# Initialize hawk-eye in an existing React + Vite project
pnpm hawk-eye init

# Development
pnpm dev          # Start dev server with HMR
pnpm build        # Build all packages
pnpm test         # Run 124 tests
pnpm type-check   # TypeScript validation
pnpm lint         # ESLint
pnpm token-audit  # Design token compliance check
```

---

## Architecture

Hawk-Eye is built on 8 engineering pillars:

1. **Composable Primitives** — 7 reusable building blocks for controls
2. **Centralized State** — Pure reducer + middleware + framework adapters
3. **Strict Type Safety** — Property schemas, token validators, typed actions
4. **Design System Enforcement** — 3-layer token architecture, zero hardcoded values
5. **Plugin Architecture** — Event-driven registry for custom extensions
6. **Comprehensive Testing** — 124 tests across 14 files
7. **Framework-Agnostic** — Core store with React, Vue 3, and Svelte adapters
8. **Documentation** — Architecture guide, API docs, spec files

See [ARCHITECTURE.md](./packages/client/src/ARCHITECTURE.md) for the full guide.

---

## Repository Layout

```
hawk-eye/
├── packages/
│   ├── client/           # UI runtime (controls, store, schema)
│   │   └── src/
│   │       ├── store/    # Framework-agnostic state management
│   │       ├── schema/   # Property schemas & token validators
│   │       └── controls/ # 16 controls + 7 primitives
│   ├── vite-plugin/      # Vite integration (source analysis, HMR, plugins)
│   └── hawk-eye/         # Public package (React, Vue, Svelte entrypoints)
├── demo/                 # Local React + Tailwind demo app
├── tests/                # Vitest test suite (124 tests)
├── specs/                # Design system specifications
├── scripts/              # Token audit and tooling
└── shared/               # Shared protocol definitions
```

---

## Package Exports

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
