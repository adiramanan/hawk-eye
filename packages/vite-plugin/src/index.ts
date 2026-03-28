import type { Plugin, ResolvedConfig } from 'vite';
import { createHawkEyeServerState, type HawkEyePluginOptions, updateHawkEyeServerRoot } from './plugin-state';
import { registerSaveHandler } from './save-handler';
import { registerStyleFileInvalidation } from './style-cache-invalidation';
import { injectSourceMetadata } from './source-injector';
import { registerInspectHandler } from './ws-server';

function warnIfReactRunsBeforeHawkEye(plugin: Plugin, config: Pick<ResolvedConfig, 'logger' | 'plugins'>) {
  const hawkEyeIndex = config.plugins.findIndex((candidate) => candidate.name === plugin.name);
  const reactIndex = config.plugins.findIndex((candidate) => candidate.name.startsWith('vite:react'));

  if (hawkEyeIndex === -1 || reactIndex === -1 || reactIndex > hawkEyeIndex) {
    return;
  }

  config.logger.warn(
    '[hawk-eye] `hawkeyePlugin()` should be placed before `react()` in the Vite plugins array. React transforms shifted the injected source coordinates, so Apply cannot map DOM edits back to the original file.'
  );
}

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
  const plugin: Plugin = {
    name: '@hawk-eye/vite-plugin',
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      updateHawkEyeServerRoot(state, config.root);
      warnIfReactRunsBeforeHawkEye(plugin, config);
    },
    transform(code, id) {
      return injectSourceMetadata(code, id, state.root, state);
    },
    configureServer(server) {
      registerStyleFileInvalidation(server, state);
      registerInspectHandler(server, state);

      if (state.saveEnabled) {
        registerSaveHandler(server, state);
      }
    },
  };

  return plugin;
}

export type { Plugin } from 'vite';
export type { HawkEyePluginOptions } from './plugin-state';
