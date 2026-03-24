/**
 * Hawk-Eye Store — Svelte Adapter
 *
 * Svelte-compatible store using the Svelte store contract.
 * The hawk-eye store's subscribe(listener): unsubscribe pattern
 * matches Svelte's readable store contract exactly.
 *
 * Compatible with Svelte 4 ($store syntax) and Svelte 5 (runes + $store).
 *
 * Usage in .svelte files:
 *
 *   <script>
 *     import { hawkEyeStore, hawkEyeDispatch } from 'hawk-eye/svelte';
 *
 *     // Auto-subscribe with $ prefix (Svelte magic)
 *     $: enabled = $hawkEyeStore.enabled;
 *     $: drafts = $hawkEyeStore.drafts;
 *
 *     function toggleEnabled() {
 *       hawkEyeDispatch({ type: 'SET_ENABLED', payload: !$hawkEyeStore.enabled });
 *     }
 *   </script>
 *
 * Usage with selectors:
 *
 *   <script>
 *     import { createHawkEyeReadable } from 'hawk-eye/svelte';
 *
 *     const enabled = createHawkEyeReadable(s => s.enabled);
 *     // $enabled is now a boolean that auto-updates
 *   </script>
 */

import type { HawkEyeState, StoreAction, HawkEyeStore } from './types';
import {
  createHawkEyeStore,
  getGlobalStore,
  setGlobalStore,
} from './index';
import {
  createStoreWithMiddleware,
  previewMiddleware,
  validationMiddleware,
  loggerMiddleware,
} from './middleware';

/**
 * Svelte store contract: { subscribe(fn): unsubscribe }
 */
export interface SvelteReadable<T> {
  subscribe(fn: (value: T) => void): () => void;
}

/**
 * The hawk-eye store as a Svelte-compatible readable store.
 * Use with $hawkEyeStore in .svelte files for auto-subscription.
 *
 * The store already matches Svelte's readable store contract:
 *   subscribe(listener: (state) => void): () => void
 */
export const hawkEyeStore: SvelteReadable<HawkEyeState> = {
  subscribe(fn: (value: HawkEyeState) => void): () => void {
    const store = getGlobalStore();

    // Svelte calls the subscriber immediately with the current value
    fn(store.getState());

    // Then subscribe to future updates
    return store.subscribe(fn);
  },
};

/**
 * Dispatch function for sending actions from Svelte components.
 */
export function hawkEyeDispatch(action: StoreAction): void {
  getGlobalStore().dispatch(action);
}

/**
 * Create a derived readable store that selects a slice of state.
 * Equivalent to useHawkEyeSelector in React / Vue.
 *
 * Only notifies subscribers when the selected value changes.
 *
 * @param selector Function to extract a value from state
 */
export function createHawkEyeReadable<T>(
  selector: (state: HawkEyeState) => T
): SvelteReadable<T> {
  return {
    subscribe(fn: (value: T) => void): () => void {
      const store = getGlobalStore();

      // Emit initial value
      let prev = selector(store.getState());
      fn(prev);

      // Subscribe with change detection
      return store.subscribe((state) => {
        const next = selector(state);
        if (next !== prev) {
          prev = next;
          fn(next);
        }
      });
    },
  };
}

/**
 * Initialize the hawk-eye store with middleware.
 * Call once at app startup (equivalent to HawkEyeProvider in React).
 *
 * @param options Configuration options
 */
export function initHawkEyeStore(options: {
  store?: HawkEyeStore;
  enableLogging?: boolean;
} = {}): HawkEyeStore {
  const { store: providedStore, enableLogging = false } = options;

  const baseStore = providedStore || createHawkEyeStore();

  const middlewares = [previewMiddleware, validationMiddleware];
  if (enableLogging) {
    middlewares.push(loggerMiddleware);
  }

  const store = createStoreWithMiddleware(baseStore, ...middlewares);
  setGlobalStore(store);

  return store;
}
