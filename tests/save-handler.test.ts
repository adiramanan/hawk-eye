import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  handleSaveRequest,
  saveToBranch,
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

function runGit(cwd: string, args: string[]) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
  }).trim();
}

function commitAll(cwd: string, message: string) {
  runGit(cwd, ['add', '.']);
  runGit(cwd, [
    '-c',
    'user.name=Test User',
    '-c',
    'user.email=test@example.com',
    '-c',
    'commit.gpgSign=false',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-m',
    message,
  ]);
}

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

function createTempGitWorkspace(source: string) {
  const repoRoot = mkdtempSync(join(tmpdir(), 'hawk-eye-save-handler-'));
  const viteRoot = join(repoRoot, 'demo');
  const srcDir = join(viteRoot, 'src');
  const filePath = join(srcDir, 'App.tsx');

  mkdirSync(srcDir, { recursive: true });
  writeFileSync(filePath, source, 'utf8');
  tempRoots.push(repoRoot);

  runGit(repoRoot, ['init', '-b', 'main']);
  commitAll(repoRoot, 'Initial commit');

  return {
    filePath,
    repoRoot,
    viteRoot,
  };
}

function createAuthorizedClient(
  state: ReturnType<typeof createHawkEyeServerState>,
  client = { send: vi.fn() }
) {
  const capability = issueSaveCapability(state, client as never);

  if (!capability) {
    throw new Error('Expected save capability to be issued.');
  }

  return {
    capability,
    client,
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
  it('writes mutations on a review branch and restores the original branch afterwards', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { capability, client } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.viteRoot;

    const result = handleSaveRequest(state, client as never, {
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
    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(runGit(workspace.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('main');
    expect(runGit(workspace.repoRoot, ['status', '--porcelain'])).toBe('');
    expect(readFileSync(workspace.filePath, 'utf8')).toContain('className="pt-4 bg-white"');
    expect(runGit(workspace.repoRoot, ['show', `${result.branch}:demo/src/App.tsx`])).toContain(
      'className="pt-6 bg-white"'
    );
  });

  it('preserves a dirty working tree while saving changes on a review branch', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { capability, client } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    writeFileSync(join(workspace.repoRoot, 'notes.txt'), 'dirty\n', 'utf8');

    state.root = workspace.viteRoot;

    const result = handleSaveRequest(state, client as never, {
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

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(runGit(workspace.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('main');
    expect(readFileSync(workspace.filePath, 'utf8')).toContain('className="pt-4 bg-white"');
    expect(readFileSync(join(workspace.repoRoot, 'notes.txt'), 'utf8')).toBe('dirty\n');
    expect(runGit(workspace.repoRoot, ['status', '--porcelain'])).toContain('?? notes.txt');
    expect(runGit(workspace.repoRoot, ['show', `${result.branch}:demo/src/App.tsx`])).toContain(
      'className="pt-6 bg-white"'
    );
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
  });

  it('rejects saves with an invalid capability token', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { client } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.viteRoot;

    const result = handleSaveRequest(state, client as never, {
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
      error: 'Save aborted because the current client is not authorized to write source changes.',
      branch: undefined,
      warnings: [
        {
          code: 'invalid-capability',
          file: '',
          line: 0,
          column: 0,
          message: 'The save capability was missing, stale, or did not belong to the current client.',
        },
      ],
    });
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SAVE_RESULT_EVENT, result);
  });

  it('rejects saves until the plugin is explicitly configured to allow them', () => {
    const source = `
      export function App() {
        return (
          <div className="w-full h-full">Metadata</div>
        );
      }
    `;
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<div');
    const state = createSaveState(false);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.viteRoot;

    const result = saveToBranch(state, {
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
      error: 'Save to branch is disabled. Enable `enableSave` in `hawkeyePlugin()` to use it.',
      branch: undefined,
      warnings: [
        {
          code: 'save-disabled',
          file: '',
          line: 0,
          column: 0,
          message: 'Save to branch is disabled for this Vite plugin instance.',
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
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<button');
    const state = createSaveState();
    const { capability, client } = createAuthorizedClient(state);
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    writeFileSync(
      workspace.filePath,
      source.replace('pt-4 bg-white', 'pt-6 bg-white'),
      'utf8'
    );

    state.root = workspace.viteRoot;

    const result = handleSaveRequest(state, client as never, {
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
        `Save aborted because src/App.tsx:${position.line}:${position.column} changed after selection. Re-select the element and try again.`,
      branch: undefined,
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
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<div');
    const state = createSaveState();
    const fingerprint = createFingerprint(workspace.filePath, position.line, position.column);

    state.root = workspace.viteRoot;

    const result = saveToBranch(state, {
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

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    const branchSource = runGit(workspace.repoRoot, ['show', `${result.branch}:demo/src/App.tsx`]);
    expect(branchSource).toContain('"--hawk-eye-width-mode": "relative"');
    expect(branchSource).toContain('"--hawk-eye-height-mode": "fill"');
    expect(runGit(workspace.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('main');
  });
});
