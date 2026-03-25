/**
 * Hawk-Eye Plugin Registry (Pillar 5)
 *
 * Extensible plugin system for custom writers, analyzers, and middleware.
 * Enables users to add functionality without modifying core code.
 */

export interface HawkEyePlugin {
  name: string;
  version: string;
  execute(event: string, data: any): Promise<void> | void;
}

export type PluginEventHandler = (data: any) => Promise<void> | void;

/**
 * Plugin registry
 */
export class PluginRegistry {
  private plugins = new Map<string, HawkEyePlugin>();
  private eventHandlers = new Map<string, Set<PluginEventHandler>>();

  /**
   * Register a plugin
   */
  register(plugin: HawkEyePlugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin already registered: ${plugin.name}`);
    }
    this.plugins.set(plugin.name, plugin);
    // Plugin registered successfully
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string) {
    this.plugins.delete(name);
    this.eventHandlers.delete(name);
  }

  /**
   * Get plugin
   */
  get(name: string): HawkEyePlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAll(): HawkEyePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Execute event across all plugins
   */
  async execute(event: string, data: any) {
    const promises = Array.from(this.plugins.values()).map((plugin) =>
      Promise.resolve().then(() => plugin.execute(event, data))
    );

    await Promise.all(promises);
  }

  /**
   * Register event handler for specific event
   */
  on(event: string, handler: PluginEventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event to all handlers
   */
  async emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;

    const promises = Array.from(handlers).map((handler) =>
      Promise.resolve().then(() => handler(data))
    );

    await Promise.all(promises);
  }
}

/**
 * Global plugin registry
 */
export const globalPluginRegistry = new PluginRegistry();

// Built-in event types
export const HAWK_EYE_EVENTS = {
  STYLE_ANALYSIS: 'style:analysis',
  PROPERTY_CHANGE: 'property:change',
  BEFORE_SAVE: 'save:before',
  AFTER_SAVE: 'save:after',
  ERROR: 'error',
} as const;
