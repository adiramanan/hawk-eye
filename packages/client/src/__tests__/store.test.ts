/**
 * Store Tests
 *
 * Tests for the centralized state management system.
 * Verifies reducer purity, action dispatch, and subscriptions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHawkEyeStore, hawkEyeReducer, initialState } from '../store';
import type { HawkEyeState, StoreAction } from '../store';

describe('HawkEyeStore', () => {
  describe('Store Factory', () => {
    it('creates a store with initial state', () => {
      const store = createHawkEyeStore();
      const state = store.getState();

      expect(state).toEqual(initialState);
      expect(state.enabled).toBe(false);
      expect(state.drafts).toEqual({});
      expect(state.selected).toBeNull();
    });
  });

  describe('Reducer Purity', () => {
    it('returns new state object on changes', () => {
      const action: StoreAction = { type: 'SET_ENABLED', payload: true };
      const nextState = hawkEyeReducer(initialState, action);

      expect(nextState).not.toBe(initialState);
      expect(nextState.enabled).toBe(true);
      expect(initialState.enabled).toBe(false); // Original unchanged
    });

    it('returns same state for unrecognized actions', () => {
      const action = { type: 'UNKNOWN' } as any;
      const nextState = hawkEyeReducer(initialState, action);

      expect(nextState).toBe(initialState);
    });
  });

  describe('Actions', () => {
    it('handles SET_ENABLED', () => {
      const action: StoreAction = { type: 'SET_ENABLED', payload: true };
      const nextState = hawkEyeReducer(initialState, action);

      expect(nextState.enabled).toBe(true);
    });

    it('handles SET_SHELL_STATE', () => {
      const action: StoreAction = { type: 'SET_SHELL_STATE', payload: 'open' };
      const nextState = hawkEyeReducer(initialState, action);

      expect(nextState.shellState).toBe('open');
    });

    it('handles SET_SAVE_PENDING', () => {
      const action: StoreAction = { type: 'SET_SAVE_PENDING', payload: true };
      const nextState = hawkEyeReducer(initialState, action);

      expect(nextState.savePending).toBe(true);
    });

    it('handles CLEAR_DRAFTS', () => {
      const stateWithDrafts: HawkEyeState = {
        ...initialState,
        drafts: { key1: {} as any, key2: {} as any },
      };

      const action: StoreAction = { type: 'CLEAR_DRAFTS' };
      const nextState = hawkEyeReducer(stateWithDrafts, action);

      expect(nextState.drafts).toEqual({});
    });
  });

  describe('Subscriptions', () => {
    it('notifies subscribers on state changes', () => {
      const store = createHawkEyeStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.dispatch({ type: 'SET_ENABLED', payload: true });

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    });

    it('does not notify on no-op actions', () => {
      const store = createHawkEyeStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.dispatch({ type: 'UNKNOWN' } as any);

      expect(listener).not.toHaveBeenCalled();
    });

    it('unsubscribe removes listener', () => {
      const store = createHawkEyeStore();
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      store.dispatch({ type: 'SET_ENABLED', payload: true });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
