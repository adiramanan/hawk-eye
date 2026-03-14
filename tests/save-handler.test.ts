import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAWK_EYE_SAVE_RESULT_EVENT, handleSaveRequest, saveToBranch } from '../packages/vite-plugin/src/save-handler';

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
    const client = {
      send: vi.fn(),
    };

    const result = handleSaveRequest(workspace.viteRoot, client, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            {
              propertyId: 'paddingTop',
              cssProperty: 'padding-top',
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

  it('aborts save when the working tree is dirty', () => {
    const source = `
      export function App() {
        return (
          <button className="pt-4 bg-white">Save</button>
        );
      }
    `;
    const workspace = createTempGitWorkspace(source);
    const position = getLineAndColumn(source, '<button');

    writeFileSync(join(workspace.repoRoot, 'notes.txt'), 'dirty\n', 'utf8');

    const result = saveToBranch(workspace.viteRoot, {
      mutations: [
        {
          file: 'src/App.tsx',
          line: position.line,
          column: position.column,
          styleMode: 'tailwind',
          detached: false,
          properties: [
            {
              propertyId: 'paddingTop',
              cssProperty: 'padding-top',
              oldValue: '1rem',
              newValue: '1.5rem',
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      success: false,
      error: 'Save aborted because the working tree has uncommitted changes. Commit or stash them first.',
      branch: undefined,
      warnings: [],
    });
    expect(runGit(workspace.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).toBe('main');
  });
});
