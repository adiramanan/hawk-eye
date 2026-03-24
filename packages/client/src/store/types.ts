/**
 * Hawk-Eye Store Types
 *
 * Centralized state management for the design tool.
 * Follows normalized state architecture for predictable updates.
 */

import type { MeasuredElement, SaveResult, SelectionDraft } from '../types';
import type { InspectorShellState } from '../Inspector';

/**
 * Actions dispatched to the store
 */
export type StoreAction =
  | { type: 'INIT_PORTAL'; payload: HTMLElement }
  | { type: 'SET_ENABLED'; payload: boolean }
  | { type: 'SET_HOVERED'; payload: MeasuredElement | null }
  | { type: 'SET_MOTION_PREFERENCE'; payload: boolean }
  | { type: 'SET_PREFERS_REDUCED_MOTION'; payload: boolean }
  | { type: 'SET_SELECTED'; payload: { element: MeasuredElement | null; key: string | null } }
  | { type: 'SET_SELECTED_INSTANCE_KEY'; payload: string | null }
  | { type: 'UPDATE_DRAFT'; payload: { key: string; draft: SelectionDraft } }
  | { type: 'DELETE_DRAFT'; payload: string }
  | { type: 'CLEAR_DRAFTS' }
  | { type: 'SET_SAVE_PENDING'; payload: boolean }
  | { type: 'SET_SAVE_RESULT'; payload: SaveResult | null }
  | { type: 'SET_SHELL_STATE'; payload: InspectorShellState }
  | { type: 'SET_DRAFTS'; payload: Record<string, SelectionDraft> }
  | { type: 'UPDATE_DRAFTS_BULK'; payload: Record<string, SelectionDraft> };

/**
 * Normalized state structure
 */
export interface HawkEyeState {
  // UI state
  enabled: boolean;
  portalRoot: HTMLElement | null;
  prefersReducedMotion: boolean;
  shellState: InspectorShellState;

  // Selection state
  selected: MeasuredElement | null;
  selectedInstanceKey: string | null;
  hovered: MeasuredElement | null;

  // Draft management
  drafts: Record<string, SelectionDraft>;

  // Save state
  savePending: boolean;
  saveResult: SaveResult | null;
}

/**
 * Store interface with dispatch and subscribe
 */
export interface HawkEyeStore {
  getState(): HawkEyeState;
  dispatch(action: StoreAction): void;
  subscribe(listener: (state: HawkEyeState) => void): () => void;
}

/**
 * Store listener type
 */
export type StoreListener = (state: HawkEyeState) => void;
