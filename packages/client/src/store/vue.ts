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
 *   const state = useHawkEyeState();           // Ref<HawkEyeState>
 *   const enabled = useHawkEyeSelector(s => s.enabled); // ComputedRef<boolean>
 *   const dispatch = useHawkEyeDispatch();
 */

import {
  shallowRef,
  computed,
  onScopeDispose,
  getCurrentScope,
  type ShallowRef,
  type ComputedRef,
} from 'vue';
import type { HawkEyeState, StoreAction } from './types';
import { getGlobalStore } from './index';

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

  // Clean up subscription when effect scope (component) is destroyed
  if (getCurrentScope()) {
    onScopeDispose(unsubscribe);
  }

  return state;
}

/**
 * Select a slice of state with automatic memoization.
 * Only triggers reactivity when the selected value changes.
 *
 * @param selector Function to extract a value from state
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
 * Returns a tuple of [computed selected value, dispatch function].
 *
 * @param selector Function to extract a value from state
 */
export function useHawkEyeReducer<T>(
  selector: (state: HawkEyeState) => T
): readonly [ComputedRef<T>, (action: StoreAction) => void] {
  const value = useHawkEyeSelector(selector);
  const dispatch = useHawkEyeDispatch();
  return [value, dispatch] as const;
}
