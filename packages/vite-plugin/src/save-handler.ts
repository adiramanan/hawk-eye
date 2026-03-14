import { realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { HMRBroadcasterClient, ViteDevServer } from 'vite';
import {
  commitChanges,
  createBranch,
  getCurrentBranch,
  getGitRoot,
  hasUncommittedChanges,
  restoreOriginalBranch,
} from './git-ops';
import type {
  ElementMutation,
  MutationWarning,
  PropertyMutation,
  SavePayload,
  SaveResult,
} from './mutations';
import { writeSourceMutations } from './source-writer';

export const HAWK_EYE_SAVE_EVENT = 'hawk-eye:save';
export const HAWK_EYE_SAVE_RESULT_EVENT = 'hawk-eye:save-result';

function normalizeFilePath(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

function createTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function createBranchName(date = new Date()) {
  return `hawk-eye/design-tweaks-${createTimestamp(date)}`;
}

function isPropertyMutation(value: unknown): value is PropertyMutation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.propertyId === 'string' &&
    typeof candidate.cssProperty === 'string' &&
    typeof candidate.oldValue === 'string' &&
    typeof candidate.newValue === 'string'
  );
}

function isElementMutation(value: unknown): value is ElementMutation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.file === 'string' &&
    typeof candidate.line === 'number' &&
    typeof candidate.column === 'number' &&
    typeof candidate.styleMode === 'string' &&
    typeof candidate.detached === 'boolean' &&
    Array.isArray(candidate.properties) &&
    candidate.properties.every(isPropertyMutation)
  );
}

function isSavePayload(value: unknown): value is SavePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return Array.isArray(candidate.mutations) && candidate.mutations.every(isElementMutation);
}

function buildErrorResult(
  error: string,
  warnings: MutationWarning[] = [],
  branch?: string
): SaveResult {
  return {
    success: false,
    error,
    branch,
    warnings,
  };
}

function toGitRelativeFiles(viteRoot: string, gitRoot: string, files: string[]) {
  const resolvedGitRoot = realpathSync(gitRoot);

  return files.map((file) =>
    normalizeFilePath(relative(resolvedGitRoot, realpathSync(resolve(viteRoot, file))))
  );
}

export function saveToBranch(root: string, payload: SavePayload): SaveResult {
  if (!isSavePayload(payload)) {
    return buildErrorResult('Invalid save payload.');
  }

  if (payload.mutations.length === 0) {
    return buildErrorResult('There are no pending mutations to save.');
  }

  let gitRoot: string;

  try {
    gitRoot = getGitRoot(root);
  } catch (error) {
    return buildErrorResult(
      error instanceof Error ? error.message : 'Could not resolve the git repository root.'
    );
  }

  if (hasUncommittedChanges(gitRoot)) {
    return buildErrorResult(
      'Save aborted because the working tree has uncommitted changes. Commit or stash them first.'
    );
  }

  const originalBranch = getCurrentBranch(gitRoot);
  const branchName = createBranchName();
  let branchCreated = false;
  let writeWarnings: MutationWarning[] = [];

  try {
    createBranch(gitRoot, branchName);
    branchCreated = true;

    const writeResult = writeSourceMutations(root, payload);
    writeWarnings = writeResult.warnings;

    if (writeResult.modifiedFiles.length === 0) {
      restoreOriginalBranch(gitRoot, originalBranch);

      return buildErrorResult(
        'Save aborted because the writer did not produce any source changes.',
        writeWarnings
      );
    }

    const gitFiles = toGitRelativeFiles(root, gitRoot, writeResult.modifiedFiles);
    const commitSha = commitChanges(gitRoot, gitFiles, 'Apply Hawk-Eye design changes');

    restoreOriginalBranch(gitRoot, originalBranch);

    return {
      success: true,
      branch: branchName,
      commitSha,
      modifiedFiles: writeResult.modifiedFiles,
      warnings: writeWarnings,
    };
  } catch (error) {
    let errorMessage =
      error instanceof Error ? error.message : 'Save failed while creating the review branch.';

    if (branchCreated) {
      try {
        if (!hasUncommittedChanges(gitRoot) && getCurrentBranch(gitRoot) !== originalBranch) {
          restoreOriginalBranch(gitRoot, originalBranch);
        } else {
          errorMessage = `${errorMessage} Branch ${branchName} may still be checked out.`;
        }
      } catch {
        errorMessage = `${errorMessage} Branch ${branchName} may still be checked out.`;
      }
    }

    return buildErrorResult(errorMessage, writeWarnings, branchCreated ? branchName : undefined);
  }
}

export function handleSaveRequest(root: string, client: HMRBroadcasterClient, data: unknown) {
  const result = saveToBranch(root, data as SavePayload);
  client.send(HAWK_EYE_SAVE_RESULT_EVENT, result);
  return result;
}

export function registerSaveHandler(server: ViteDevServer, root: string) {
  server.ws.on(HAWK_EYE_SAVE_EVENT, (data, client) => {
    handleSaveRequest(root, client, data);
  });
}
