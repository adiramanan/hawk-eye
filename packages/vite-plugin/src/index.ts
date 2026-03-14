import type { Plugin } from 'vite';
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
export default function hawkeyePlugin(): Plugin {
  let root = process.cwd();

  return {
    name: '@hawk-eye/vite-plugin',
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    transform(code, id) {
      return injectSourceMetadata(code, id, root);
    },
    configureServer(server) {
      registerInspectHandler(server, root);
      registerSaveHandler(server, root);
    },
  };
}

export type { Plugin } from 'vite';
