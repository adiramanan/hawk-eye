/**
 * Hawk-Eye Plugin Loader
 *
 * Runtime plugin loading from npm packages, local files, or plugin specs.
 * Enables extensibility without modifying core code.
 */

import type { HawkEyePlugin } from './plugin-registry';
import { globalPluginRegistry } from './plugin-registry';

export interface PluginLoadOptions {
  // Local path or npm package name
  source: string;
  // Optional plugin name override
  name?: string;
  // Plugin initialization config
  config?: Record<string, any>;
}

export interface PluginSpec {
  // Plugin name
  name: string;
  // Plugin version
  version: string;
  // Plugin entry point or factory
  factory: () => HawkEyePlugin | Promise<HawkEyePlugin>;
}

/**
 * Load a plugin from various sources
 */
export async function loadPlugin(options: PluginLoadOptions): Promise<HawkEyePlugin> {
  const { source, name, config } = options;

  try {
    // Try to load as npm package first
    if (!source.startsWith('/') && !source.startsWith('.')) {
      try {
        const module = await import(source);
        const plugin = module.default || module;
        return normalizePlugin(plugin, name, config);
      } catch (e) {
        // Fall through to local path
      }
    }

    // Try to load as local file (for bundlers that support dynamic imports)
    const module = await import(source);
    const plugin = module.default || module;
    return normalizePlugin(plugin, name, config);
  } catch (error) {
    throw new Error(`Failed to load plugin from "${source}": ${(error as Error).message}`);
  }
}

/**
 * Normalize various plugin formats into HawkEyePlugin interface
 */
function normalizePlugin(
  plugin: any,
  nameOverride?: string,
  config?: Record<string, any>
): HawkEyePlugin {
  // Already a plugin
  if (plugin && typeof plugin.execute === 'function') {
    return {
      name: nameOverride || plugin.name || 'unknown',
      version: plugin.version || '0.0.0',
      execute: plugin.execute,
    };
  }

  // Factory function
  if (typeof plugin === 'function') {
    return plugin(config);
  }

  // Plugin spec with factory
  if (plugin && typeof plugin.factory === 'function') {
    const instance = plugin.factory();
    if (instance && typeof (instance as any).execute === 'function') {
      return {
        name: nameOverride || (instance as any).name || plugin.name || 'unknown',
        version: (instance as any).version || plugin.version || '0.0.0',
        execute: (instance as any).execute,
      };
    }
  }

  throw new Error(`Invalid plugin format: ${typeof plugin}`);
}

/**
 * Load and register multiple plugins
 */
export async function loadPlugins(
  pluginOptions: PluginLoadOptions[]
): Promise<HawkEyePlugin[]> {
  const plugins: HawkEyePlugin[] = [];

  for (const options of pluginOptions) {
    try {
      const plugin = await loadPlugin(options);
      globalPluginRegistry.register(plugin);
      plugins.push(plugin);
    } catch (error) {
      console.error(`[Hawk-Eye] Failed to load plugin:`, error);
      // Continue loading other plugins on error
    }
  }

  return plugins;
}

/**
 * Built-in plugin specs
 */
export const BUILTIN_PLUGINS: Record<string, PluginLoadOptions> = {
  tailwind: {
    source: '@hawk-eye/plugin-tailwind',
    name: 'tailwind-writer',
  },
  emotion: {
    source: '@hawk-eye/plugin-emotion',
    name: 'emotion-writer',
  },
  'css-modules': {
    source: '@hawk-eye/plugin-css-modules',
    name: 'css-modules-writer',
  },
  'git-diff': {
    source: '@hawk-eye/plugin-git-diff',
    name: 'git-diff-analyzer',
  },
  eslint: {
    source: '@hawk-eye/plugin-eslint',
    name: 'eslint-linter',
  },
};

/**
 * Load built-in plugins by name
 */
export async function loadBuiltInPlugin(
  name: keyof typeof BUILTIN_PLUGINS
): Promise<HawkEyePlugin> {
  const options = BUILTIN_PLUGINS[name];
  if (!options) {
    throw new Error(`Unknown built-in plugin: ${name}`);
  }
  return loadPlugin(options);
}
