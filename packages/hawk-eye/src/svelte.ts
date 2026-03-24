/**
 * Hawk-Eye Svelte entrypoint
 *
 * Re-exports Svelte-compatible stores from the client package.
 * Import from 'hawk-eye/svelte' in Svelte projects.
 */

// Svelte stores
export {
  hawkEyeStore,
  hawkEyeDispatch,
  createHawkEyeReadable,
  initHawkEyeStore,
} from '../../client/src/store/svelte';
export type { SvelteReadable } from '../../client/src/store/svelte';

// Core types (framework-agnostic)
export type {
  HawkEyeState,
  HawkEyeStore,
  StoreAction,
} from '../../client/src/store/types';
