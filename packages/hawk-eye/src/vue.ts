/**
 * Hawk-Eye Store — Vue 3 Adapter
 *
 * Vue 3 Composition API composables for the framework-agnostic store.
 * Uses shallowRef for performance (avoids deep reactivity on state tree).
 *
 * Requirements: Vue >= 3.3
 *
 * Usage:
 *   import { useHawkEyeState, useHawkEyeDispatch } from 'hawk-eye/vue';
 *
 *   const state = useHawkEyeState();                      // Ref<HawkEyeState>
 *   const enabled = useHawkEyeSelector(s => s.enabled);   // ComputedRef<boolean>
 *   const dispatch = useHawkEyeDispatch();
 */

import {
  shallowRef,
  computed,
  onScopeDispose,
  getCurrentScope,
  type ShallowRef,
  type ComputedRef,
  type App,
  type InjectionKey,
  inject,
} from 'vue';
import type { HawkEyeState, HawkEyeStore, StoreAction } from '../../client/src/store/types';
import {
  createHawkEyeStore,
  getGlobalStore,
  setGlobalStore,
} from '../../client/src/store/index';
import {
  createStoreWithMiddleware,
  previewMiddleware,
  validationMiddleware,
  loggerMiddleware,
} from '../../client/src/store/middleware';

// ── Core types (re-exported for convenience) ────────────────────────
export type { HawkEyeState, HawkEyeStore, StoreAction } from '../../client/src/store/types';

// ── Composables ─────────────────────────────────────────────────────

/**
 * Get the full store state as a reactive ref.
 * Re-renders the component when any state changes.
 */
export function useHawkEyeState(): Readonly<ShallowRef<HawkEyeState>> {
  const store = getGlobalStore();
  const state = shallowRef(store.getState());

  const unsubscribe = store.subscribe((nextState) => {
    state.value = nextState;
  });

  if (getCurrentScope()) {
    onScopeDispose(unsubscribe);
  }

  return state;
}

/**
 * Select a slice of state with automatic memoization.
 * Only triggers reactivity when the selected value changes.
 */
export function useHawkEyeSelector<T>(
  selector: (state: HawkEyeState) => T
): ComputedRef<T> {
  const state = useHawkEyeState();
  return computed(() => selector(state.value));
}

/**
 * Get the dispatch function for sending actions to the store.
 */
export function useHawkEyeDispatch(): (action: StoreAction) => void {
  const store = getGlobalStore();
  return store.dispatch.bind(store);
}

/**
 * Convenience composable combining selector + dispatch.
 */
export function useHawkEyeReducer<T>(
  selector: (state: HawkEyeState) => T
): readonly [ComputedRef<T>, (action: StoreAction) => void] {
  const value = useHawkEyeSelector(selector);
  const dispatch = useHawkEyeDispatch();
  return [value, dispatch] as const;
}

// ── Vue Plugin ──────────────────────────────────────────────────────

export const HAWK_EYE_STORE_KEY: InjectionKey<HawkEyeStore> = Symbol('hawk-eye-store');

export interface HawkEyePluginOptions {
  store?: HawkEyeStore;
  enableLogging?: boolean;
}

/**
 * Vue plugin — install via app.use(HawkEyeVuePlugin)
 */
export const HawkEyeVuePlugin = {
  install(app: App, options: HawkEyePluginOptions = {}) {
    const { store: providedStore, enableLogging = false } = options;
    const baseStore = providedStore || createHawkEyeStore();

    const middlewares = [previewMiddleware, validationMiddleware];
    if (enableLogging) {
      middlewares.push(loggerMiddleware);
    }

    const store = createStoreWithMiddleware(baseStore, ...middlewares);
    setGlobalStore(store);
    app.provide(HAWK_EYE_STORE_KEY, store);
  },
};

/**
 * Get store via inject(). Falls back to global store.
 */
export function useStore(): HawkEyeStore {
  const store = inject(HAWK_EYE_STORE_KEY, null);
  return store || getGlobalStore();
}
