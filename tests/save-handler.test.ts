import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySourceChanges,
  handleSaveRequest,
} from '../packages/vite-plugin/src/save-handler';
import {
  analyzeStyleAtPosition,
  createStyleAnalysisFingerprint,
} from '../packages/vite-plugin/src/style-analyzer';
import {
  createHawkEyeServerState,
  issueSaveCapability,
} from '../packages/vite-plugin/src/plugin-state';
import { HAWK_EYE_SAVE_RESULT_EVENT } from '../shared/protocol';

const tempRoots: string[] = [];

function createSaveState(enableSave = true) {
  return createHawkEyeServerState({ enableSave });
}

function getLineAndColumn(source: string, search: string) {
  const index = source.indexOf(search);

  if (index === -1) {
    throw new Error(`Could not find search token: ${search}`);
  }

  const precedingText = source.slice(0, index);
  const lines = precedingText.split('\n');

  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function createTempWorkspace(source: string) {
  const root = mkdtempSync(join(tmpdir(), 'hawk-eye-save-handler-'));
  const srcDir = join(root, 'src');
  const filePath = join(srcDir, 'App.tsx');

  mkdirSync(srcDir, { recursive: true });
  writeFileSync(filePath, source, 'utf8');
  tempRoots.push(root);

  return {
    filePath,
    root,
  };
}

function createAuthorizedClient(
  state: ReturnType<typeof createHawkEyeServerState>,
  options: {
    client?: { send: ReturnType<typeof vi.fn> };
    clientId?: string;
  } = {}
) {
  const client = options.client ?? { send: vi.fn() };
  const clientId = options.clientId ?? 'client-a';
  const capability = issueSaveCapability(state, clientId);

  if (!capability) {
    throw new Error('Expected save capability to be issued.');
  }

  return {
    capability,
    client,
    clientId,
  };
}

function createFingerprint(filePath: string, line: number, column: number) {
  const analysis = analyzeStyleAtPosition(filePath, line, column);
  return createStyleAnalysisFingerprint(analysis);
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();

    if (root) {
      rmSync(root, { force: true, recursive: true });
    }
  }
});

describe('save handler', () => {
  it('writes mutations directly into the source file', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { capability, client, clientId } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = handleSaveRequest(state, client as never, {
      clientId,
      capability,
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
    expect(result).toEqual({
      success: true,
      modifiedFiles: ['src/App.tsx'],
      warnings: [],
    });
    expect(readFileSync(workspace.filePath, 'utf8')).toContain('className="pt-6 bg-white"');
  });

  it('rejects writes with an invalid capability token', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { client } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = handleSaveRequest(state, client as never, {
      clientId: 'client-a',
      capability: 'stale-capability',
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: 'Write aborted because the current client is not authorized to edit source files.',
      warnings: [
        {
          code: 'invalid-capability',
          file: '',
          line: 0,
          column: 0,
          message:
            'The save capability was missing, stale, or did not belong to the current client session.',
        },
      ],
    });
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
  });

  it('accepts issued save capabilities after the websocket client identity changes', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const originalClient = { send: vi.fn() };
    const { capability, clientId } = createAuthorizedClient(state, {
      client: originalClient,
      clientId: 'preview-a',
    });
    const nextClient = { send: vi.fn() };
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = handleSaveRequest(state, nextClient as never, {
      clientId,
      capability,
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      modifiedFiles: ['src/App.tsx'],
      warnings: [],
    });
    expect(nextClient.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
    expect(readFileSync(workspace.filePath, 'utf8')).toContain('className="pt-6 bg-white"');
  });

  it('rejects capabilities issued to a different client session', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { capability } = createAuthorizedClient(state, {
      clientId: 'preview-a',
    });
    const nextClient = { send: vi.fn() };
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = handleSaveRequest(state, nextClient as never, {
      clientId: 'preview-b',
      capability,
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: 'Write aborted because the current client is not authorized to edit source files.',
      warnings: [
        {
          code: 'invalid-capability',
          file: '',
          line: 0,
          column: 0,
          message:
            'The save capability was missing, stale, or did not belong to the current client session.',
        },
      ],
    });
    expect(nextClient.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
  });

  it('rejects direct writes until the plugin is explicitly configured to allow them', () => {
    const source = `
      export function App() {
        return (
          <div className="w-full h-full">Metadata</div>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<div');
    const state = createSaveState(false);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = applySourceChanges(state, {
      clientId: 'client-a',
      capability: 'unused',
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [],
          sizeModeMetadata: {
            width: 'relative',
            height: 'fill',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: 'Direct source writes are disabled. Enable `enableSave` in `hawkeyePlugin()` to use them.',
      warnings: [
        {
          code: 'save-disabled',
          file: '',
          line: 0,
          column: 0,
          message: 'Direct source writes are disabled for this Vite plugin instance.',
        },
      ],
    });
  });

  it('rejects stale selections that no longer match the saved source', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { capability, client, clientId } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    writeFileSync(
      workspace.filePath,
      source.replace('pt-4 bg-white', 'pt-6 bg-white'),
      'utf8'
    );

    state.root = workspace.root;

    const result = handleSaveRequest(state, client as never, {
      clientId,
      capability,
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: false,
      error:
        `Write aborted because src/App.tsx:${position.line}:${position.column} changed after selection. Re-select the element and try again.`,
      warnings: [
        {
          code: 'stale-selection',
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          message:
            `The current style fingerprint for src/App.tsx:${position.line}:${position.column} no longer matches the selected element.`,
        },
      ],
    });
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
  });

  it('accepts size mode metadata without ordinary property mutations', () => {
    const source = `
      export function App() {
        return (
          <div className="w-full h-full">Metadata</div>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<div');
    const state = createSaveState();
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = applySourceChanges(state, {
      clientId: 'client-a',
      capability: 'unused',
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [],
          sizeModeMetadata: {
            width: 'relative',
            height: 'fill',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      modifiedFiles: ['src/App.tsx'],
      warnings: [],
    });

    const updatedSource = readFileSync(workspace.filePath, 'utf8');
    expect(updatedSource).toContain('"--hawk-eye-width-mode": "relative"');
    expect(updatedSource).toContain('"--hawk-eye-height-mode": "fill"');
  });

  it('writes dynamic className edits by wrapping the existing style expression', () => {
    const source = `
      export function App() {
        return (
          <button className={getClassName()} style={styles}>Wrapped</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = applySourceChanges(state, {
      clientId: 'client-a',
      capability: 'unused',
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'paddingTop',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      modifiedFiles: ['src/App.tsx'],
      warnings: [],
    });

    expect(readFileSync(workspace.filePath, 'utf8')).toContain(
      'style={{ ...styles, paddingTop: "1.5rem" }}'
    );
  });

  it('surfaces the highest-signal warning when inline fallback cannot rewrite the style prop', () => {
    const source = `
      export function App() {
        return (
          <button className="font-semibold" style="color:red">Blocked</button>
        );
      }
    `;
    const workspace = createTempWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.root;

    const result = applySourceChanges(state, {
      clientId: 'client-a',
      capability: 'unused',
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          detached: false,
          fingerprint,
          properties: [
            {
              propertyId: 'fontWeight',
              oldValue: '600',
              newValue: '550',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: 'Skipped fontWeight because the style prop is not an object literal.',
      warnings: [
        {
          code: 'unsupported-dynamic-style',
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          propertyId: 'fontWeight',
          message: 'Skipped fontWeight because the style prop is not an object literal.',
        },
      ],
    });
  });
});
