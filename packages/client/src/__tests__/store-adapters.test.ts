/**
 * Store Adapter Tests
 *
 * Tests the Svelte store contract adapter.
 * Vue composables require a Vue runtime, so they are tested structurally.
 * The Svelte adapter uses the generic store contract and can be tested in pure JS.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHawkEyeStore, setGlobalStore, resetGlobalStore } from '../store';
import {
  hawkEyeStore,
  hawkEyeDispatch,
  createHawkEyeReadable,
  initHawkEyeStore,
} from '../store/svelte';

describe('Svelte Store Adapter', () => {
  beforeEach(() => {
    resetGlobalStore();
  });

  describe('hawkEyeStore (Svelte readable contract)', () => {
    it('calls subscriber immediately with current state', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      const listener = vi.fn();
      hawkEyeStore.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it('notifies subscriber on state changes', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      const listener = vi.fn();
      hawkEyeStore.subscribe(listener);

      // First call was the initial value
      expect(listener).toHaveBeenCalledTimes(1);

      store.dispatch({ type: 'SET_ENABLED', payload: true });

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });

    it('returns unsubscribe function', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      const listener = vi.fn();
      const unsubscribe = hawkEyeStore.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();

      store.dispatch({ type: 'SET_ENABLED', payload: true });
      expect(listener).toHaveBeenCalledTimes(1); // No additional calls
    });
  });

  describe('hawkEyeDispatch', () => {
    it('dispatches actions to the global store', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      hawkEyeDispatch({ type: 'SET_ENABLED', payload: true });

      expect(store.getState().enabled).toBe(true);
    });
  });

  describe('createHawkEyeReadable (derived store)', () => {
    it('emits selected value immediately', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      const enabled = createHawkEyeReadable((s) => s.enabled);
      const listener = vi.fn();
      enabled.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('only notifies when selected value changes', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      const enabled = createHawkEyeReadable((s) => s.enabled);
      const listener = vi.fn();
      enabled.subscribe(listener);

      // Dispatch action that changes enabled
      store.dispatch({ type: 'SET_ENABLED', payload: true });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(true);

      // Dispatch action that doesn't change enabled
      store.dispatch({ type: 'SET_SHELL_STATE', payload: 'open' });
      expect(listener).toHaveBeenCalledTimes(2); // No additional call
    });

    it('returns unsubscribe function', () => {
      const store = createHawkEyeStore();
      setGlobalStore(store);

      const enabled = createHawkEyeReadable((s) => s.enabled);
      const listener = vi.fn();
      const unsubscribe = enabled.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();

      store.dispatch({ type: 'SET_ENABLED', payload: true });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('initHawkEyeStore', () => {
    it('creates and sets a global store', () => {
      const store = initHawkEyeStore();

      expect(store).toBeDefined();
      expect(store.getState()).toBeDefined();
      expect(store.getState().enabled).toBe(false);
    });

    it('accepts a custom store', () => {
      const custom = createHawkEyeStore();
      custom.dispatch({ type: 'SET_ENABLED', payload: true });

      const store = initHawkEyeStore({ store: custom });

      // Should use middleware-wrapped custom store
      expect(store.getState().enabled).toBe(true);
    });
  });
});
