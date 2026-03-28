import { existsSync, realpathSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import type { ViteDevServer } from 'vite';
import { clearStyleAnalysisCache, type HawkEyeServerState } from './plugin-state';
import { invalidateAuthoredClassTargetIndex } from './stylesheet-index';

const STYLESHEET_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);

function isPathInsideRoot(root: string, filePath: string) {
  const relativePath = relative(root, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

export function shouldInvalidateStyleCaches(root: string, filePath: string) {
  if (!filePath || !STYLESHEET_EXTENSIONS.has(extname(filePath).toLowerCase())) {
    return false;
  }

  const resolvedRoot = realpathSync(root);
  const candidateFile = isAbsolute(filePath) ? filePath : resolve(resolvedRoot, filePath);
  const absoluteFile = existsSync(candidateFile) ? realpathSync(candidateFile) : candidateFile;

  return isPathInsideRoot(resolvedRoot, absoluteFile);
}

export function invalidateStyleCachesForFile(state: HawkEyeServerState, filePath: string) {
  if (!shouldInvalidateStyleCaches(state.root, filePath)) {
    return false;
  }

  invalidateAuthoredClassTargetIndex(state.root);
  clearStyleAnalysisCache(state);
  return true;
}

export function registerStyleFileInvalidation(server: ViteDevServer, state: HawkEyeServerState) {
  const invalidate = (filePath: string) => {
    invalidateStyleCachesForFile(state, filePath);
  };

  server.watcher.on('add', invalidate);
  server.watcher.on('change', invalidate);
  server.watcher.on('unlink', invalidate);
}
