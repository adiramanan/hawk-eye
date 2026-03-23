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
} from '../packages/vite-plugin/src/ws-server';

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
});
