/**
 * Hawk-Eye Store React Hooks
 *
 * React 18+ hooks using useSyncExternalStore pattern
 * for efficient store integration.
 */

import { useSyncExternalStore } from 'react';
import type { HawkEyeState } from './types';
import { getGlobalStore } from './index';

/**
 * Hook to get the entire store state
 * Automatically re-renders when state changes
 */
export function useHawkEyeState(): HawkEyeState {
  const store = getGlobalStore();

  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState()
  );
}

/**
 * Hook to get a specific slice of store state
 * Only re-renders when the selected slice changes
 *
 * @param selector Function to select state slice
 * @returns The selected state value
 */
export function useHawkEyeSelector<T>(selector: (state: HawkEyeState) => T): T {
  const store = getGlobalStore();

  return useSyncExternalStore(
    (listener) => {
      let prevValue = selector(store.getState());

      return store.subscribe((state) => {
        const nextValue = selector(state);
        if (nextValue !== prevValue) {
          prevValue = nextValue;
          listener();
        }
      });
    },
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

/**
 * Hook to dispatch actions to the store
 */
export function useHawkEyeDispatch() {
  const store = getGlobalStore();
  return store.dispatch.bind(store);
}

/**
 * Convenience hook combining selector + dispatch
 * Useful for components that need specific state + ability to update it
 */
export function useHawkEyeReducer<T>(selector: (state: HawkEyeState) => T) {
  const value = useHawkEyeSelector(selector);
  const dispatch = useHawkEyeDispatch();
  return [value, dispatch] as const;
}
