/**
 * Hawk-Eye Store — Vue 3 Plugin
 *
 * Vue plugin for providing the store via dependency injection.
 * Equivalent to React's HawkEyeProvider / Context pattern.
 *
 * Usage:
 *   import { createApp } from 'vue';
 *   import { HawkEyePlugin } from 'hawk-eye/vue';
 *
 *   const app = createApp(App);
 *   app.use(HawkEyePlugin, { enableLogging: true });
 *
 *   // In components:
 *   import { useStore } from 'hawk-eye/vue';
 *   const store = useStore();
 */

import type { App, InjectionKey } from 'vue';
import type { HawkEyeStore } from './types';
import { createHawkEyeStore, getGlobalStore, setGlobalStore } from './index';
import {
  createStoreWithMiddleware,
  previewMiddleware,
  validationMiddleware,
  loggerMiddleware,
} from './middleware';

/**
 * Injection key for type-safe provide/inject
 */
export const HAWK_EYE_STORE_KEY: InjectionKey<HawkEyeStore> = Symbol('hawk-eye-store');

/**
 * Plugin options
 */
export interface HawkEyePluginOptions {
  store?: HawkEyeStore;
  enableLogging?: boolean;
}

/**
 * Vue plugin object — install via app.use(HawkEyePlugin)
 */
export const HawkEyeVuePlugin = {
  install(app: App, options: HawkEyePluginOptions = {}) {
    const { store: providedStore, enableLogging = false } = options;

    // Create or use provided store
    const baseStore = providedStore || createHawkEyeStore();

    // Apply middleware
    const middlewares = [previewMiddleware, validationMiddleware];
    if (enableLogging) {
      middlewares.push(loggerMiddleware);
    }

    const store = createStoreWithMiddleware(baseStore, ...middlewares);

    // Set as global store so composables can access it
    setGlobalStore(store);

    // Provide via injection for explicit inject() usage
    app.provide(HAWK_EYE_STORE_KEY, store);
  },
};

/**
 * Get the store via inject() — use inside setup().
 * Falls back to the global store if no plugin was installed.
 */
export function useStore(): HawkEyeStore {
  // Dynamic import to avoid hard Vue dep at module level
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { inject } = require('vue') as typeof import('vue');
  const store = inject(HAWK_EYE_STORE_KEY, null);
  return store || getGlobalStore();
}
