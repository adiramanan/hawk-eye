import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export interface ResolvedWorkspaceFile {
  absoluteFile: string;
  normalizedFile: string;
  resolvedRoot: string;
}

export type ResolveWorkspaceFileFailure =
  | 'file-not-found'
  | 'invalid-path'
  | 'outside-root'
  | 'symlink-not-allowed';

function normalizeFilePath(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

function isPathInsideRoot(root: string, resolvedFile: string) {
  return resolvedFile === root || resolvedFile.startsWith(`${root}${sep}`);
}

export function resolveWorkspaceFile(
  root: string,
  file: string
):
  | {
      ok: true;
      value: ResolvedWorkspaceFile;
    }
  | {
      ok: false;
      reason: ResolveWorkspaceFileFailure;
    } {
  const normalizedFile = normalizeFilePath(file);

  if (
    !normalizedFile ||
    normalizedFile.startsWith('/') ||
    normalizedFile === '..' ||
    normalizedFile.startsWith('../')
  ) {
    return {
      ok: false,
      reason: 'invalid-path',
    };
  }

  const resolvedRoot = realpathSync(root);
  const candidateFile = resolve(resolvedRoot, normalizedFile);

  if (!isPathInsideRoot(resolvedRoot, candidateFile)) {
    return {
      ok: false,
      reason: 'outside-root',
    };
  }

  if (!existsSync(candidateFile)) {
    return {
      ok: false,
      reason: 'file-not-found',
    };
  }

  if (lstatSync(candidateFile).isSymbolicLink()) {
    return {
      ok: false,
      reason: 'symlink-not-allowed',
    };
  }

  const absoluteFile = realpathSync(candidateFile);

  if (!isPathInsideRoot(resolvedRoot, absoluteFile)) {
    return {
      ok: false,
      reason: 'outside-root',
    };
  }

  return {
    ok: true,
    value: {
      absoluteFile,
      normalizedFile,
      resolvedRoot,
    },
  };
}
