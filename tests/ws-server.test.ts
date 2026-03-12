import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HAWK_EYE_STYLE_ANALYSIS_EVENT,
  HAWK_EYE_SELECTION_EVENT,
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

  return {
    root,
    sourceToken: `src/App.tsx:${lines.length}:${(lines.at(-1)?.length ?? 0) + 1}`,
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
    const payload = resolveSelectionPayload(process.cwd(), {
      source: 'demo/src/App.tsx:1:1',
    });

    expect(payload).toEqual({
      source: 'demo/src/App.tsx:1:1',
      file: 'demo/src/App.tsx',
      line: 1,
      column: 1,
    });
  });

  it('ignores out-of-root paths safely', () => {
    const payload = resolveSelectionPayload(process.cwd(), {
      source: '../secrets.tsx:1:1',
    });

    expect(payload).toBeNull();
  });

  it('sends selection payloads back to the requesting client', () => {
    const client = {
      send: vi.fn(),
    };

    const payload = handleInspectRequest(process.cwd(), client, {
      source: 'demo/src/App.tsx:1:1',
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

    const payload = handleStyleAnalysisRequest(workspace.root, client, {
      source: workspace.sourceToken,
    });

    expect(payload).toEqual({
      source: workspace.sourceToken,
      mode: 'tailwind',
      classNames: ['px-4', 'py-2', 'rounded-lg'],
      inlineStyles: {},
    });
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_STYLE_ANALYSIS_EVENT, payload);
  });
});
