import type { Plugin } from 'vite';

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
  return {
    name: '@hawk-eye/vite-plugin',
    apply: 'serve',
    configResolved(_config) {
      // Configuration initialization to be implemented in Phase 1
    },
    configureServer(_server) {
      // Server setup for WebSocket and file watching
      // To be implemented in Phase 1
    },
  };
}

export type { Plugin } from 'vite';
