/**
 * Hawk-Eye Store
 *
 * Centralized state management following Redux-like patterns.
 * Framework-agnostic store that can be used with any UI framework.
 *
 * Usage:
 *   const store = createHawkEyeStore();
 *   store.dispatch({ type: 'SET_ENABLED', payload: true });
 *   const state = store.getState();
 *   const unsubscribe = store.subscribe((state) => console.log(state));
 */

import type { HawkEyeState, HawkEyeStore, StoreAction, StoreListener } from './types';
import { hawkEyeReducer, initialState } from './reducer';

export type { HawkEyeState, HawkEyeStore, StoreAction, StoreListener } from './types';
export { hawkEyeReducer, initialState } from './reducer';

/**
 * Create a new Hawk-Eye store instance
 */
export function createHawkEyeStore(): HawkEyeStore {
  let currentState = initialState;
  const listeners = new Set<StoreListener>();

  return {
    getState() {
      return currentState;
    },

    dispatch(action: StoreAction) {
      const nextState = hawkEyeReducer(currentState, action);

      // Only notify listeners if state actually changed
      if (nextState !== currentState) {
        currentState = nextState;
        listeners.forEach((listener) => listener(currentState));
      }
    },

    subscribe(listener: StoreListener) {
      listeners.add(listener);

      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * Global store instance (singleton)
 * Used by React hooks to access the store
 */
let globalStore: HawkEyeStore | null = null;

export function getGlobalStore(): HawkEyeStore {
  if (!globalStore) {
    globalStore = createHawkEyeStore();
  }
  return globalStore;
}

export function setGlobalStore(store: HawkEyeStore) {
  globalStore = store;
}

export function resetGlobalStore() {
  globalStore = null;
}
