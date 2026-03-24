/**
 * Hawk-Eye Store Middleware
 *
 * Middleware system for handling side effects (preview, WebSocket sync, validation, etc.)
 * Follows a simple pipeline pattern: (store, action) => nextAction
 */

import type { HawkEyeStore, StoreAction, HawkEyeState } from './types';
import type { SelectionDraft } from '../types';
import {
  applyDraftToElement,
  clearDraftOverrides,
  getInspectableElementByKey,
} from '../drafts';

/**
 * Middleware function type
 * Takes current state and action, returns potentially modified action or side effects
 */
export type Middleware = (store: HawkEyeStore) => (next: (action: StoreAction) => void) => (action: StoreAction) => void;

/**
 * Preview Middleware
 * Applies live CSS previews to elements when properties change
 */
export const previewMiddleware: Middleware = (store) => (next) => (action) => {
  // Apply preview BEFORE dispatching action
  if (action.type === 'UPDATE_DRAFT') {
    const { key, draft } = action.payload;
    const element = getInspectableElementByKey(key);
    if (element && element instanceof HTMLElement) {
      applyDraftToElement(element, draft);
    }
  }

  // Clear previews when clearing drafts
  if (action.type === 'CLEAR_DRAFTS') {
    // Get all drafts from current state and clear their overrides
    const state = store.getState();
    Object.values(state.drafts).forEach((draft) => {
      clearDraftOverrides(draft);
    });
  }

  // Dispatch the action
  next(action);
};

/**
 * Validation Middleware
 * Validates property values before applying them
 */
export const validationMiddleware: Middleware = (store) => (next) => (action) => {
  // For now, just pass through - validation logic can be added here
  // This middleware placeholder allows for future validation rules
  next(action);
};

/**
 * Logger Middleware (Development only)
 * Logs all actions and state changes
 * Disabled by default - enable by setting window.__HAWK_EYE_DEBUG__ = true
 */
export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  const isDevelopment = typeof window !== 'undefined' && (window as any).__HAWK_EYE_DEBUG__;

  if (isDevelopment) {
    const prevState = store.getState();
    console.group(`[Store] ${action.type}`);
    console.log('Previous State:', prevState);
    console.log('Action:', action);
  }

  next(action);

  if (isDevelopment) {
    const nextState = store.getState();
    console.log('Next State:', nextState);
    console.groupEnd();
  }
};

/**
 * Compose middleware functions
 * Creates a chain of middleware that process actions in order
 */
export function composeMiddleware(...middlewares: Middleware[]) {
  return (store: HawkEyeStore) => {
    let dispatch = store.dispatch.bind(store);

    // Build middleware chain
    middlewares.forEach((middleware) => {
      const wrappedDispatch = dispatch;
      dispatch = (action: StoreAction) => {
        middleware(store)((action) => wrappedDispatch(action))(action);
      };
    });

    return dispatch;
  };
}

/**
 * Create a store with middleware
 */
export function createStoreWithMiddleware(
  store: HawkEyeStore,
  ...middlewares: Middleware[]
): HawkEyeStore {
  const dispatch = composeMiddleware(...middlewares)(store);

  return {
    ...store,
    dispatch,
  };
}
