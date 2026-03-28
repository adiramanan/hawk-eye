import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HAWK_EYE_SELECTION_EVENT,
  HAWK_EYE_STYLE_ANALYSIS_EVENT,
} from '../shared/protocol';
import { createHawkEyeServerState, createSignedSourceToken } from '../packages/vite-plugin/src/plugin-state';
import {
  handleStyleAnalysisRequest,
  handleInspectRequest,
  resolveSelectionPayload,
  resolveStyleAnalysisPayload,
} from '../packages/vite-plugin/src/ws-server';
import { invalidateStyleCachesForFile } from '../packages/vite-plugin/src/style-cache-invalidation';

const tempRoots: string[] = [];

function createTempWorkspace(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'hawk-eye-ws-server-'));
  const srcDir = join(root, 'src');
  const filePath = join(srcDir, 'App.tsx');
  const buttonIndex = source.indexOf('<button');
  const lines = source.slice(0, buttonIndex).split('\n');

  mkdirSync(srcDir, { recursive: true });
  writeFileSync(filePath, source, 'utf8');
  tempRoots.push(root);
  const state = createHawkEyeServerState({ enableSave: true });
  state.root = root;

  return {
    state,
    sourceToken: createSignedSourceToken(
      state,
      'src/App.tsx',
      lines.length,
      (lines.at(-1)?.length ?? 0) + 1
    ),
  };
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();

    if (root) {
      rmSync(root, { force: true, recursive: true });
    }
  }
});

describe('inspect request handling', () => {
  it('returns canonical selection payloads for in-root files', () => {
    const state = createHawkEyeServerState({ enableSave: true });
    const client = { send: vi.fn() };
    const payload = resolveSelectionPayload(state, client as never, {
      clientId: 'preview-a',
      source: createSignedSourceToken(state, 'demo/src/App.tsx', 1, 1),
    });

    expect(payload).toEqual({
      source: createSignedSourceToken(state, 'demo/src/App.tsx', 1, 1),
      file: 'demo/src/App.tsx',
      line: 1,
      column: 1,
      saveCapability: expect.any(String),
      saveEnabled: true,
    });
  });

  it('ignores out-of-root paths safely', () => {
    const state = createHawkEyeServerState({ enableSave: true });
    const client = { send: vi.fn() };
    const payload = resolveSelectionPayload(state, client as never, {
      clientId: 'preview-a',
      source: createSignedSourceToken(state, '../secrets.tsx', 1, 1),
    });

    expect(payload).toBeNull();
  });

  it('sends selection payloads back to the requesting client', () => {
    const state = createHawkEyeServerState({ enableSave: true });
    const client = {
      send: vi.fn(),
    };

    const payload = handleInspectRequest(state, client as never, {
      clientId: 'preview-a',
      source: createSignedSourceToken(state, 'demo/src/App.tsx', 1, 1),
    });

    expect(payload?.file).toBe('demo/src/App.tsx');
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SELECTION_EVENT, payload);
  });

  it('sends style analysis payloads back to the requesting client', () => {
    const workspace = createTempWorkspace(`
      export function App() {
        return (
          <button className="px-4 py-2 rounded-lg">Save</button>
        );
      }
    `);
    const client = {
      send: vi.fn(),
    };

    const payload = handleStyleAnalysisRequest(workspace.state, client as never, {
      clientId: 'preview-a',
      source: workspace.sourceToken,
    });

    expect(payload).toMatchObject({
      source: workspace.sourceToken,
      mode: 'tailwind',
      classNames: ['px-4', 'py-2', 'rounded-lg'],
      classAttributeState: 'literal',
      inlineStyles: {},
      styleAttributeState: 'missing',
      fingerprint: expect.any(String),
      saveCapability: expect.any(String),
      saveEnabled: true,
    });
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_STYLE_ANALYSIS_EVENT, payload);
  });

  it('replays cached style analysis with the requesting client session capability', () => {
    const workspace = createTempWorkspace(`
      export function App() {
        return (
          <button className="px-4 py-2 rounded-lg">Save</button>
        );
      }
    `);
    const firstClient = { send: vi.fn() };
    const secondClient = { send: vi.fn() };

    const firstPayload = handleStyleAnalysisRequest(workspace.state, firstClient as never, {
      clientId: 'preview-a',
      source: workspace.sourceToken,
    });
    const secondPayload = handleStyleAnalysisRequest(workspace.state, secondClient as never, {
      clientId: 'preview-b',
      source: workspace.sourceToken,
    });

    expect(firstPayload?.fingerprint).toBe(secondPayload?.fingerprint);
    expect(firstPayload?.saveCapability).toEqual(expect.any(String));
    expect(secondPayload?.saveCapability).toEqual(expect.any(String));
    expect(firstPayload?.saveCapability).not.toBe(secondPayload?.saveCapability);
  });

  it('includes declared inspector properties on authored class targets', () => {
    const root = mkdtempSync(join(tmpdir(), 'hawk-eye-class-target-props-'));
    const srcDir = join(root, 'src');
    const appPath = join(srcDir, 'App.tsx');
    const cssPath = join(srcDir, 'index.css');
    const source = `
      export function App() {
        return (
          <button className="filled framed">Save</button>
        );
      }
    `;
    const buttonIndex = source.indexOf('<button');
    const lines = source.slice(0, buttonIndex).split('\n');

    mkdirSync(srcDir, { recursive: true });
    writeFileSync(appPath, source, 'utf8');
    writeFileSync(
      cssPath,
      `.filled {\n  background: #111827;\n}\n\n.framed {\n  padding: 12px;\n  border: 2px solid #d1d5db;\n}\n`,
      'utf8'
    );
    tempRoots.push(root);

    const state = createHawkEyeServerState({ enableSave: true });
    state.root = root;
    const sourceToken = createSignedSourceToken(
      state,
      'src/App.tsx',
      lines.length,
      (lines.at(-1)?.length ?? 0) + 1
    );

    const payload = resolveStyleAnalysisPayload(state, { send: vi.fn() } as never, {
      clientId: 'preview-a',
      source: sourceToken,
    });

    expect(payload?.classTargets).toContainEqual(
      expect.objectContaining({
        className: 'filled',
        declaredPropertyIds: expect.arrayContaining(['backgroundColor', 'backgroundImage']),
        declaredCssValues: {
          background: '#111827',
        },
      })
    );
    expect(payload?.classTargets).toContainEqual(
      expect.objectContaining({
        className: 'framed',
        declaredPropertyIds: expect.arrayContaining([
          'paddingTop',
          'paddingRight',
          'paddingBottom',
          'paddingLeft',
          'borderStyle',
          'borderColor',
          'borderTopWidth',
          'borderRightWidth',
          'borderBottomWidth',
          'borderLeftWidth',
        ]),
        declaredCssValues: {
          padding: '12px',
          border: '2px solid #d1d5db',
        },
      })
    );
  });

  it('refreshes authored class targets after external stylesheet edits invalidate style caches', () => {
    const root = mkdtempSync(join(tmpdir(), 'hawk-eye-style-cache-'));
    const srcDir = join(root, 'src');
    const appPath = join(srcDir, 'App.tsx');
    const cssPath = join(srcDir, 'index.css');
    const source = `
      export function App() {
        return (
          <button className="he-chip">Save</button>
        );
      }
    `;
    const buttonIndex = source.indexOf('<button');
    const lines = source.slice(0, buttonIndex).split('\n');

    mkdirSync(srcDir, { recursive: true });
    writeFileSync(appPath, source, 'utf8');
    writeFileSync(
      cssPath,
      `.he-kicker,\n.he-chip,\n.he-status-chip,\n.he-note-tag {\n  display: inline-flex;\n}\n`,
      'utf8'
    );
    tempRoots.push(root);

    const state = createHawkEyeServerState({ enableSave: true });
    state.root = root;
    const sourceToken = createSignedSourceToken(
      state,
      'src/App.tsx',
      lines.length,
      (lines.at(-1)?.length ?? 0) + 1
    );

    const firstPayload = resolveStyleAnalysisPayload(state, { send: vi.fn() } as never, {
      clientId: 'preview-a',
      source: sourceToken,
    });

    expect(firstPayload?.classTargets).toContainEqual(
      expect.objectContaining({
        className: 'he-chip',
        selector: '.he-kicker,\n.he-chip,\n.he-status-chip,\n.he-note-tag',
      })
    );

    writeFileSync(
      cssPath,
      `.he-kicker,\n.he-note-tag {\n  display: inline-flex;\n}\n\n.he-chip {\n  display: inline-flex;\n}\n\n.he-status-chip {\n  display: inline-flex;\n}\n`,
      'utf8'
    );

    const cachedPayload = resolveStyleAnalysisPayload(state, { send: vi.fn() } as never, {
      clientId: 'preview-b',
      source: sourceToken,
    });

    expect(cachedPayload?.classTargets).toContainEqual(
      expect.objectContaining({
        className: 'he-chip',
        selector: '.he-kicker,\n.he-chip,\n.he-status-chip,\n.he-note-tag',
      })
    );

    expect(invalidateStyleCachesForFile(state, cssPath)).toBe(true);

    const refreshedPayload = resolveStyleAnalysisPayload(state, { send: vi.fn() } as never, {
      clientId: 'preview-c',
      source: sourceToken,
    });

    expect(refreshedPayload?.classTargets).toContainEqual(
      expect.objectContaining({
        className: 'he-chip',
        selector: '.he-chip',
      })
    );
  });
});
