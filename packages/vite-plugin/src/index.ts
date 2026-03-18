import type { Plugin } from 'vite';
import { createHawkEyeServerState, type HawkEyePluginOptions, updateHawkEyeServerRoot } from './plugin-state';
import { registerSaveHandler } from './save-handler';
import { injectSourceMetadata } from './source-injector';
import { registerInspectHandler } from './ws-server';

/**
 * Hawk-Eye Vite Plugin
 *
 * Provides server-side integration for:
 * - Source injection (data-source attributes)
 * - Style detection (Tailwind vs inline)
 * - Code mutation (write changes back to files)
 * - WebSocket bridge to client
 *
 * Phase 1–3: Implement inspector bridge, writers, and file persistence
 */
export default function hawkeyePlugin(options: HawkEyePluginOptions = {}): Plugin {
  const state = createHawkEyeServerState(options);

  return {
    name: '@hawk-eye/vite-plugin',
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      updateHawkEyeServerRoot(state, config.root);
    },
    transform(code, id) {
      return injectSourceMetadata(code, id, state.root, state);
    },
    configureServer(server) {
      registerInspectHandler(server, state);

      if (state.saveEnabled) {
        registerSaveHandler(server, state);
      }
    },
  };
}

export type { Plugin } from 'vite';
export type { HawkEyePluginOptions } from './plugin-state';
