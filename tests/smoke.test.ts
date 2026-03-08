import { describe, expect, it } from 'vitest';
import { DesignTool } from '../packages/client/src';
import hawkeyePlugin from '../packages/vite-plugin/src';

describe('workspace smoke tests', () => {
  it('exports the design tool component', () => {
    expect(typeof DesignTool).toBe('function');
  });

  it('creates the serve-only Vite plugin', () => {
    const plugin = hawkeyePlugin();

    expect(plugin.name).toBe('@hawk-eye/vite-plugin');
    expect(plugin.apply).toBe('serve');
    expect(plugin.enforce).toBe('pre');
    expect(typeof plugin.transform).toBe('function');
    expect(typeof plugin.configureServer).toBe('function');
  });
});
