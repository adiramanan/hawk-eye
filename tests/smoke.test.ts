import { describe, expect, it } from 'vitest';
import { DesignTool } from '../packages/client/src';
import hawkeyePlugin from '../packages/vite-plugin/src';

describe('Phase 0 smoke tests', () => {
  it('exports the placeholder design tool component', () => {
    const element = DesignTool({});

    expect(element.type).toBe('div');
    expect(element.props['data-testid']).toBe('hawk-eye-design-tool');
  });

  it('creates the serve-only Vite plugin shell', () => {
    const plugin = hawkeyePlugin();

    expect(plugin.name).toBe('@hawk-eye/vite-plugin');
    expect(plugin.apply).toBe('serve');
    expect(typeof plugin.configResolved).toBe('function');
    expect(typeof plugin.configureServer).toBe('function');
  });
});
