import type { HMRBroadcasterClient, ViteDevServer } from 'vite';
import {
  HAWK_EYE_SAVE_EVENT,
  HAWK_EYE_SAVE_RESULT_EVENT,
  type ClientPropertyMutation,
  type MutationWarning,
  type MutationWarningCode,
  type SavePayload as ClientSavePayload,
  type SaveResult,
  type SizeModeMetadata,
} from '../../../shared/protocol';
import { getEditableCssProperty } from '../../../shared/property-map';
import type { ElementMutation, PropertyMutation } from './mutations';
import { resolveWorkspaceFile } from './path-security';
import { hasValidSaveCapability, type HawkEyeServerState } from './plugin-state';
import {
  analyzeStyleAtPosition,
  createStyleAnalysisFingerprint,
} from './style-analyzer';
import { writeSourceMutations } from './source-writer';

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
    typeof candidate.clientId === 'string' &&
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

function buildErrorResult(error: string, warnings: MutationWarning[] = []): SaveResult {
  return {
    success: false,
    error,
    warnings,
  };
}

function getWarningPriority(code: MutationWarningCode) {
  switch (code) {
    case 'unsupported-dynamic-style':
      return 100;
    case 'element-not-found':
      return 90;
    case 'path-outside-root':
      return 80;
    case 'unsupported-dynamic-class':
      return 70;
    case 'inline-fallback':
      return 60;
    case 'unsupported-tailwind-property':
      return 50;
    case 'file-not-found':
      return 40;
    case 'save-disabled':
      return 30;
    case 'stale-selection':
      return 20;
    case 'invalid-capability':
      return 10;
    default:
      return 0;
  }
}

function deriveErrorMessageFromWarnings(
  warnings: MutationWarning[],
  fallback: string
) {
  let bestWarning: MutationWarning | null = null;
  let bestPriority = -1;

  for (const warning of warnings) {
    const priority = getWarningPriority(warning.code);

    if (priority > bestPriority) {
      bestWarning = warning;
      bestPriority = priority;
    }
  }

  return bestWarning?.message || fallback;
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
        message: `Skipped ${mutation.propertyId} because it is not an editable source-write property.`,
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
          `Write aborted because ${mutation.file} is not a valid writable source target.`,
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
          `Write aborted because the current source at ${mutation.file}:${mutation.line}:${mutation.column} could not be analyzed.`,
          []
        ),
      };
    }

    const currentFingerprint = createStyleAnalysisFingerprint(styleAnalysis);

    if (!mutation.detached && currentFingerprint !== mutation.fingerprint) {
      return {
        ok: false,
        result: buildErrorResult(
          `Write aborted because ${mutation.file}:${mutation.line}:${mutation.column} changed after selection. Re-select the element and try again.`,
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

export function applySourceChanges(
  state: HawkEyeServerState,
  payload: ClientSavePayload
): SaveResult {
  if (!state.saveEnabled) {
    return buildErrorResult(
      'Direct source writes are disabled. Enable `enableSave` in `hawkeyePlugin()` to use them.',
      [
        {
          code: 'save-disabled',
          file: '',
          line: 0,
          column: 0,
          message: 'Direct source writes are disabled for this Vite plugin instance.',
        },
      ]
    );
  }

  if (!isClientSavePayload(payload)) {
    return buildErrorResult('Invalid write payload.');
  }

  if (payload.mutations.length === 0) {
    return buildErrorResult('There are no pending mutations to write.');
  }

  const normalizedPayload = normalizeSavePayload(state, payload);

  if (!normalizedPayload.ok) {
    return normalizedPayload.result;
  }

  const writeResult = writeSourceMutations(state.root, normalizedPayload.value);
  const warnings = [...normalizedPayload.warnings, ...writeResult.warnings];

  if (writeResult.modifiedFiles.length === 0) {
    return buildErrorResult(
      deriveErrorMessageFromWarnings(
        warnings,
        'Write aborted because the writer did not produce any source changes.'
      ),
      warnings
    );
  }

  return {
    success: true,
    modifiedFiles: writeResult.modifiedFiles,
    warnings,
  };
}

export function handleSaveRequest(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  data: unknown
) {
  if (!isClientSavePayload(data)) {
    const result = buildErrorResult(
      'Write aborted because the current client is not authorized to edit source files.',
      [
        {
          code: 'invalid-capability',
          file: '',
          line: 0,
          column: 0,
          message:
            'The save capability was missing, stale, or did not belong to the current client session.',
        },
      ]
    );
    client.send(HAWK_EYE_SAVE_RESULT_EVENT, result);
    return result;
  }

  if (!hasValidSaveCapability(state, data.clientId, data.capability)) {
    const result = buildErrorResult(
      'Write aborted because the current client is not authorized to edit source files.',
      [
        {
          code: 'invalid-capability',
          file: '',
          line: 0,
          column: 0,
          message:
            'The save capability was missing, stale, or did not belong to the current client session.',
        },
      ]
    );
    client.send(HAWK_EYE_SAVE_RESULT_EVENT, result);
    return result;
  }

  const result = applySourceChanges(state, data);
  client.send(HAWK_EYE_SAVE_RESULT_EVENT, result);
  return result;
}

export function registerSaveHandler(server: ViteDevServer, state: HawkEyeServerState) {
  server.ws.on(HAWK_EYE_SAVE_EVENT, (data, client) => {
    handleSaveRequest(state, client, data);
  });
}
