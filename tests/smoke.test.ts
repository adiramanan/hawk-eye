import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
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

  it('warns when react transforms are ordered before hawkeye source injection', () => {
    const plugin = hawkeyePlugin();
    const warn = vi.fn();

    plugin.configResolved?.({
      logger: { warn },
      plugins: [{ name: 'vite:react-babel' }, { name: '@hawk-eye/vite-plugin' }],
      root: '/tmp/hawk-eye',
    } as never);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('`hawkeyePlugin()` should be placed before `react()`')
    );
  });

  it('does not warn when hawkeye is ordered before react transforms', () => {
    const plugin = hawkeyePlugin();
    const warn = vi.fn();

    plugin.configResolved?.({
      logger: { warn },
      plugins: [{ name: '@hawk-eye/vite-plugin' }, { name: 'vite:react-babel' }],
      root: '/tmp/hawk-eye',
    } as never);

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not register save handling unless enableSave is set', () => {
    const plugin = hawkeyePlugin();
    const on = vi.fn();

    plugin.configureServer?.({
      ws: {
        on,
      },
    } as never);

    expect(on.mock.calls.map(([event]) => event)).toEqual([
      'hawk-eye:inspect',
      'hawk-eye:analyze-style',
    ]);
  });

  it('registers save handling when explicitly enabled', () => {
    const plugin = hawkeyePlugin({ enableSave: true });
    const on = vi.fn();

    plugin.configureServer?.({
      ws: {
        on,
      },
    } as never);

    expect(on.mock.calls.map(([event]) => event)).toEqual([
      'hawk-eye:inspect',
      'hawk-eye:analyze-style',
      'hawk-eye:save',
    ]);
  });

  it('declares a public CLI bin for installer usage', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../packages/hawk-eye/package.json', import.meta.url), 'utf8')
    ) as { bin?: Record<string, string> };

    expect(packageJson.bin?.['hawk-eye']).toBe('./dist/cli.js');
  });
});
