# Hawk-Eye Store

Framework-agnostic centralized state management for the design tool.

## Architecture

The store is completely decoupled from React and can be used with any framework:

```
store/
├── types.ts          # Type definitions (framework-free)
├── reducer.ts        # Pure state reducer (framework-free)
├── middleware.ts     # Side effects middleware (framework-free)
├── index.ts          # Store factory (framework-free)
├── hooks.ts          # React integration (React-specific)
├── context.tsx       # React provider (React-specific)
└── README.md         # This file
```

## Usage Patterns

### Pure JavaScript (Framework-Free)

```typescript
import { createHawkEyeStore } from '@hawk-eye/client';

const store = createHawkEyeStore();

// Get state
const state = store.getState();

// Dispatch actions
store.dispatch({ type: 'SET_ENABLED', payload: true });

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});
```

### React Integration

```typescript
import { HawkEyeProvider, useHawkEyeState, useHawkEyeDispatch } from '@hawk-eye/client';

function App() {
  return (
    <HawkEyeProvider>
      <YourApp />
    </HawkEyeProvider>
  );
}

function Component() {
  const state = useHawkEyeState();
  const dispatch = useHawkEyeDispatch();

  return (
    <button onClick={() => dispatch({ type: 'SET_ENABLED', payload: true })}>
      Enable
    </button>
  );
}
```

### Future: Vue Integration (Example)

```typescript
// Would look like:
import { useHawkEyeStore } from '@hawk-eye/client/vue';

export default {
  setup() {
    const state = useHawkEyeStore();
    return { state };
  }
}
```

### Future: Svelte Integration (Example)

```typescript
// Would look like:
import { hawkEyeStore } from '@hawk-eye/client/svelte';

let state = $hawkEyeStore;
```

## Core Modules (Framework-Free)

### Store Factory (`index.ts`)
- `createHawkEyeStore()` - Create store instance
- Observer pattern with subscribe/unsubscribe
- Global singleton store

### Reducer (`reducer.ts`)
- Pure function state machine
- 12+ action types
- Immutable state updates

### Middleware (`middleware.ts`)
- Preview middleware - applies live CSS
- Validation middleware - validates properties
- Logger middleware - debugging support
- Composable pipeline pattern

### Types (`types.ts`)
- `HawkEyeState` - Full state shape
- `StoreAction` - All action types
- `HawkEyeStore` - Store interface

## Framework Adapters (Framework-Specific)

### React (`hooks.ts`, `context.tsx`)
- `useHawkEyeState()` - Get state with re-render
- `useHawkEyeSelector()` - Efficient state slicing
- `useHawkEyeDispatch()` - Dispatch actions
- `HawkEyeProvider` - React context provider
- Uses React 18 `useSyncExternalStore` pattern

## Key Design Decisions

1. **Store is Framework-Agnostic** - Zero dependencies on React/Vue/Svelte
2. **Framework Adapters are Separate** - Each framework gets thin integration layer
3. **Middleware Pattern** - Side effects cleanly separated from state logic
4. **Observer Pattern** - Lightweight pub/sub for state changes
5. **Pure Reducer** - 100% testable state machine logic

## Future Framework Support

To add support for another framework:

1. Create `packages/client/src/store/vue.ts` (or `svelte.ts`)
2. Implement framework-specific hooks/composables
3. Use the same core store, reducer, and middleware
4. Export from `packages/client/src/index.ts`

Example Vue adapter:

```typescript
// store/vue.ts
import { reactive, computed } from 'vue';
import { getGlobalStore } from './index';

export function useHawkEyeStore() {
  const store = getGlobalStore();
  const state = reactive(store.getState());

  store.subscribe((nextState) => {
    Object.assign(state, nextState);
  });

  return { state, dispatch: store.dispatch.bind(store) };
}
```

## Summary

- ✅ Store: Framework-agnostic
- ✅ React integration: Ready
- ✅ Vue/Svelte: Patterns established, easy to add
- ✅ No lock-in: Can swap frameworks without changing store logic
