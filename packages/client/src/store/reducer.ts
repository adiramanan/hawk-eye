/**
 * Hawk-Eye Store Reducer
 *
 * Pure function for state transitions.
 * Handles all state mutations for the design tool.
 */

import type { HawkEyeState, StoreAction } from './types';

/**
 * Initial state
 */
export const initialState: HawkEyeState = {
  enabled: false,
  portalRoot: null,
  prefersReducedMotion: false,
  shellState: 'closed',
  selected: null,
  selectedInstanceKey: null,
  hovered: null,
  drafts: {},
  savePending: false,
  saveResult: null,
};

/**
 * Reducer function for state transitions
 * Pure function - returns new state without mutations
 */
export function hawkEyeReducer(state: HawkEyeState, action: StoreAction): HawkEyeState {
  switch (action.type) {
    case 'INIT_PORTAL':
      return {
        ...state,
        portalRoot: action.payload,
        enabled: true,
      };

    case 'SET_ENABLED':
      return {
        ...state,
        enabled: action.payload,
      };

    case 'SET_HOVERED':
      return {
        ...state,
        hovered: action.payload,
      };

    case 'SET_MOTION_PREFERENCE':
    case 'SET_PREFERS_REDUCED_MOTION':
      return {
        ...state,
        prefersReducedMotion: action.payload,
      };

    case 'SET_SELECTED':
      return {
        ...state,
        selected: action.payload.element,
        selectedInstanceKey: action.payload.key,
      };

    case 'SET_SELECTED_INSTANCE_KEY':
      return {
        ...state,
        selectedInstanceKey: action.payload,
      };

    case 'UPDATE_DRAFT':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.payload.key]: action.payload.draft,
        },
      };

    case 'DELETE_DRAFT': {
      const remaining = Object.fromEntries(
        Object.entries(state.drafts).filter(([key]) => key !== action.payload)
      );
      return {
        ...state,
        drafts: remaining,
      };
    }

    case 'CLEAR_DRAFTS':
      return {
        ...state,
        drafts: {},
      };

    case 'SET_DRAFTS':
      return {
        ...state,
        drafts: action.payload,
      };

    case 'SET_SAVE_PENDING':
      return {
        ...state,
        savePending: action.payload,
      };

    case 'SET_SAVE_RESULT':
      return {
        ...state,
        saveResult: action.payload,
      };

    case 'SET_SHELL_STATE':
      return {
        ...state,
        shellState: action.payload,
      };

    case 'UPDATE_DRAFTS_BULK':
      return {
        ...state,
        drafts: action.payload,
      };

    default:
      return state;
  }
}
