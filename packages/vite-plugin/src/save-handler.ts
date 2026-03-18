import { realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { HMRBroadcasterClient, ViteDevServer } from 'vite';
import {
  HAWK_EYE_SAVE_EVENT,
  HAWK_EYE_SAVE_RESULT_EVENT,
  type ClientPropertyMutation,
  type MutationWarning,
  type SavePayload as ClientSavePayload,
  type SaveResult,
  type SizeModeMetadata,
} from '../../../shared/protocol';
import { getEditableCssProperty } from '../../../shared/property-map';
import {
  commitChanges,
  createBranch,
  getCurrentBranch,
  getGitRoot,
  hasUncommittedChanges,
  restoreStashedWorkingTree,
  restoreOriginalBranch,
  stashWorkingTree,
} from './git-ops';
import type { ElementMutation, PropertyMutation } from './mutations';
import { resolveWorkspaceFile } from './path-security';
import { hasValidSaveCapability, type HawkEyeServerState } from './plugin-state';
import { analyzeStyleAtPosition, createStyleAnalysisFingerprint } from './style-analyzer';
import { writeSourceMutations } from './source-writer';

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

function isClientPropertyMutation(value: unknown): value is ClientPropertyMutation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.propertyId === 'string' &&
    typeof candidate.oldValue === 'string' &&
    typeof candidate.newValue === 'string'
  );
}

function isSizeModeMetadata(value: unknown): value is SizeModeMetadata {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const isValidModeValue = (mode: unknown) =>
    mode === undefined ||
    mode === 'fixed' ||
    mode === 'hug' ||
    mode === 'fill' ||
    mode === 'relative';

  return isValidModeValue(candidate.width) && isValidModeValue(candidate.height);
}

function isClientSavePayload(value: unknown): value is ClientSavePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.capability === 'string' &&
    Array.isArray(candidate.mutations) &&
    candidate.mutations.every((mutation) => {
      if (!mutation || typeof mutation !== 'object') {
        return false;
      }

      const record = mutation as Record<string, unknown>;

      return (
        typeof record.file === 'string' &&
        typeof record.line === 'number' &&
        typeof record.column === 'number' &&
        typeof record.detached === 'boolean' &&
        typeof record.fingerprint === 'string' &&
        Array.isArray(record.properties) &&
        record.properties.every(isClientPropertyMutation) &&
        (record.sizeModeMetadata === undefined || isSizeModeMetadata(record.sizeModeMetadata))
      );
    })
  );
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

function normalizePropertyMutation(
  mutation: ClientPropertyMutation,
  file: string,
  line: number,
  column: number
):
  | {
      ok: true;
      value: PropertyMutation;
    }
  | {
      ok: false;
      warning: MutationWarning;
    } {
  const cssProperty = getEditableCssProperty(mutation.propertyId);

  if (!cssProperty) {
    return {
      ok: false,
      warning: {
        code: 'unsupported-tailwind-property',
        file,
        line,
        column,
        propertyId: mutation.propertyId,
        message: `Skipped ${mutation.propertyId} because it is not an editable save property.`,
      },
    };
  }

  return {
    ok: true,
    value: {
      propertyId: mutation.propertyId,
      cssProperty,
      oldValue: mutation.oldValue,
      newValue: mutation.newValue,
    },
  };
}

function normalizeSavePayload(
  state: HawkEyeServerState,
  payload: ClientSavePayload
):
  | {
      ok: true;
      value: { mutations: ElementMutation[] };
      warnings: MutationWarning[];
    }
  | {
      ok: false;
      result: SaveResult;
    } {
  const warnings: MutationWarning[] = [];
  const normalizedMutations: ElementMutation[] = [];

  for (const mutation of payload.mutations) {
    const resolvedFile = resolveWorkspaceFile(state.root, mutation.file);

    if (!resolvedFile.ok) {
      return {
        ok: false,
        result: buildErrorResult(
          `Save aborted because ${mutation.file} is not a valid writable source target.`,
          [
            {
              code: 'path-outside-root',
              file: mutation.file,
              line: mutation.line,
              column: mutation.column,
              message:
                resolvedFile.reason === 'symlink-not-allowed'
                  ? `Skipped ${mutation.file} because symlinked source targets are not allowed.`
                  : `Skipped ${mutation.file} because it resolves outside the workspace root.`,
            },
          ]
        ),
      };
    }

    let styleAnalysis;

    try {
      styleAnalysis = analyzeStyleAtPosition(
        resolvedFile.value.absoluteFile,
        mutation.line,
        mutation.column
      );
    } catch {
      return {
        ok: false,
        result: buildErrorResult(
          `Save aborted because the current source at ${mutation.file}:${mutation.line}:${mutation.column} could not be analyzed.`,
          []
        ),
      };
    }

    const currentFingerprint = createStyleAnalysisFingerprint(styleAnalysis);

    if (!mutation.detached && currentFingerprint !== mutation.fingerprint) {
      return {
        ok: false,
        result: buildErrorResult(
          `Save aborted because ${mutation.file}:${mutation.line}:${mutation.column} changed after selection. Re-select the element and try again.`,
          [
            {
              code: 'stale-selection',
              file: mutation.file,
              line: mutation.line,
              column: mutation.column,
              message: `The current style fingerprint for ${mutation.file}:${mutation.line}:${mutation.column} no longer matches the selected element.`,
            },
          ]
        ),
      };
    }

    const properties: PropertyMutation[] = [];

    for (const propertyMutation of mutation.properties) {
      const normalizedProperty = normalizePropertyMutation(
        propertyMutation,
        mutation.file,
        mutation.line,
        mutation.column
      );

      if (!normalizedProperty.ok) {
        warnings.push(normalizedProperty.warning);
        continue;
      }

      properties.push(normalizedProperty.value);
    }

    normalizedMutations.push({
      file: mutation.file,
      line: mutation.line,
      column: mutation.column,
      styleMode: mutation.detached ? 'detached' : styleAnalysis.mode,
      detached: mutation.detached,
      properties,
      sizeModeMetadata: mutation.sizeModeMetadata,
    });
  }

  return {
    ok: true,
    value: {
      mutations: normalizedMutations,
    },
    warnings,
  };
}

export function saveToBranch(state: HawkEyeServerState, payload: ClientSavePayload): SaveResult {
  if (!state.saveEnabled) {
    return buildErrorResult('Save to branch is disabled. Enable `enableSave` in `hawkeyePlugin()` to use it.', [
      {
        code: 'save-disabled',
        file: '',
        line: 0,
        column: 0,
        message: 'Save to branch is disabled for this Vite plugin instance.',
      },
    ]);
  }

  if (!isClientSavePayload(payload)) {
    return buildErrorResult('Invalid save payload.');
  }

  if (payload.mutations.length === 0) {
    return buildErrorResult('There are no pending mutations to save.');
  }

  const normalizedPayload = normalizeSavePayload(state, payload);

  if (!normalizedPayload.ok) {
    return normalizedPayload.result;
  }

  let gitRoot: string;

  try {
    gitRoot = getGitRoot(state.root);
  } catch (error) {
    return buildErrorResult(
      error instanceof Error ? error.message : 'Could not resolve the git repository root.',
      normalizedPayload.warnings
    );
  }

  const originalBranch = getCurrentBranch(gitRoot);
  const branchName = createBranchName();
  let branchCreated = false;
  let stashedWorkingTreeRef: string | null = null;
  let writeWarnings: MutationWarning[] = [...normalizedPayload.warnings];

  try {
    if (hasUncommittedChanges(gitRoot)) {
      stashedWorkingTreeRef = stashWorkingTree(
        gitRoot,
        `hawk-eye-save-${branchName}`
      );
    }

    createBranch(gitRoot, branchName);
    branchCreated = true;

    const writeResult = writeSourceMutations(state.root, normalizedPayload.value);
    writeWarnings = [...writeWarnings, ...writeResult.warnings];

    if (writeResult.modifiedFiles.length === 0) {
      restoreOriginalBranch(gitRoot, originalBranch);
      if (stashedWorkingTreeRef) {
        restoreStashedWorkingTree(gitRoot, stashedWorkingTreeRef);
        stashedWorkingTreeRef = null;
      }

      return buildErrorResult(
        'Save aborted because the writer did not produce any source changes.',
        writeWarnings
      );
    }

    const gitFiles = toGitRelativeFiles(state.root, gitRoot, writeResult.modifiedFiles);
    const commitSha = commitChanges(gitRoot, gitFiles, 'Apply Hawk-Eye design changes');

    restoreOriginalBranch(gitRoot, originalBranch);
    if (stashedWorkingTreeRef) {
      restoreStashedWorkingTree(gitRoot, stashedWorkingTreeRef);
      stashedWorkingTreeRef = null;
    }

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

    if (stashedWorkingTreeRef) {
      try {
        restoreStashedWorkingTree(gitRoot, stashedWorkingTreeRef);
      } catch {
        errorMessage = `${errorMessage} Your original uncommitted changes could not be restored automatically.`;
      }
    }

    return buildErrorResult(errorMessage, writeWarnings, branchCreated ? branchName : undefined);
  }
}

export function handleSaveRequest(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  data: unknown
) {
  if (!isClientSavePayload(data) || !hasValidSaveCapability(state, client, data.capability)) {
    const result = buildErrorResult('Save aborted because the current client is not authorized to write source changes.', [
      {
        code: 'invalid-capability',
        file: '',
        line: 0,
        column: 0,
        message: 'The save capability was missing, stale, or did not belong to the current client.',
      },
    ]);
    client.send(HAWK_EYE_SAVE_RESULT_EVENT, result);
    return result;
  }

  const result = saveToBranch(state, data);
  client.send(HAWK_EYE_SAVE_RESULT_EVENT, result);
  return result;
}

export function registerSaveHandler(server: ViteDevServer, state: HawkEyeServerState) {
  server.ws.on(HAWK_EYE_SAVE_EVENT, (data, client) => {
    handleSaveRequest(state, client, data);
  });
}
