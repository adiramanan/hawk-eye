/**
 * Undo/Redo Middleware
 *
 * Integrates event sourcing with the store for undo/redo capabilities.
 * Automatically records events and enables time-travel debugging.
 */

import type { HawkEyeState, StoreAction } from './types';
import { globalEventStore, describeAction } from './event-sourcing';

/**
 * Undo/redo middleware that records all state changes
 */
export function undoRedoMiddleware(
  next: (state: HawkEyeState, action: StoreAction) => HawkEyeState
) {
  return (state: HawkEyeState, action: StoreAction): HawkEyeState => {
    // Skip recording for undo/redo actions themselves
    if ((action as { type: string }).type === 'UNDO' || (action as { type: string }).type === 'REDO') {
      return state;
    }

    // Get state after applying action
    const nextState = next(state, action);

    // Only record if state actually changed
    if (nextState !== state) {
      const description = describeAction(action);
      globalEventStore.recordEvent(action, state, nextState, description, {
        timestamp: Date.now(),
      });
    }

    return nextState;
  };
}

/**
 * Undo/redo action hooks
 */
export interface UndoRedoHooks {
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  getHistory: () => Array<{ description: string; timestamp: number }>;
  clearHistory: () => void;
}

/**
 * Create undo/redo hooks for a store
 */
export function createUndoRedoHooks(dispatch: (action: StoreAction) => void): UndoRedoHooks {
  return {
    canUndo: () => globalEventStore.canUndo(),
    canRedo: () => globalEventStore.canRedo(),

    undo: () => {
      const event = globalEventStore.getPreviousEvent();
      if (event) {
        globalEventStore.undo();
        // Dispatch action to restore state
        dispatch({
          type: 'RESTORE_STATE',
          payload: event.stateBefore,
        } as any);
      }
    },

    redo: () => {
      const event = globalEventStore.getNextEvent();
      if (event) {
        globalEventStore.redo();
        // Dispatch action to restore state
        dispatch({
          type: 'RESTORE_STATE',
          payload: event.stateAfter,
        } as any);
      }
    },

    getHistory: () => {
      return globalEventStore.getHistory().map((e) => ({
        description: e.description,
        timestamp: e.timestamp,
      }));
    },

    clearHistory: () => {
      globalEventStore.clear();
    },
  };
}

/**
 * Example React hook for undo/redo
 */
export function useUndoRedo(dispatch: (action: StoreAction) => void): UndoRedoHooks {
  return createUndoRedoHooks(dispatch);
}

/**
 * Keyboard shortcuts for undo/redo
 */
export function attachUndoRedoKeyboardShortcuts(hooks: UndoRedoHooks) {
  function handleKeyDown(event: KeyboardEvent) {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (modifier && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        hooks.redo();
      } else {
        hooks.undo();
      }
    } else if (modifier && event.key === 'y') {
      event.preventDefault();
      hooks.redo();
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}
