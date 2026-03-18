import { statSync } from 'node:fs';
import type { HMRBroadcasterClient, ViteDevServer } from 'vite';
import {
  HAWK_EYE_ANALYZE_STYLE_EVENT,
  HAWK_EYE_INSPECT_EVENT,
  HAWK_EYE_SELECTION_EVENT,
  HAWK_EYE_STYLE_ANALYSIS_EVENT,
  type InspectRequest,
  type SelectionPayload,
  type StyleAnalysisPayload,
  type StyleMode,
} from '../../../shared/protocol';
import { issueSaveCapability, parseSignedSourceToken, type HawkEyeServerState } from './plugin-state';
import { resolveWorkspaceFile } from './path-security';
import {
  analyzeStyleAtPosition,
  createStyleAnalysisFingerprint,
} from './style-analyzer';

const styleAnalysisCache = new Map<
  string,
  {
    payload: StyleAnalysisPayload;
  }
>();

function createUnknownStylePayload(
  source: string,
  saveCapability: string | null,
  saveEnabled: boolean
): StyleAnalysisPayload {
  return {
    source,
    mode: 'unknown' satisfies StyleMode,
    classNames: [],
    inlineStyles: {},
    fingerprint: createStyleAnalysisFingerprint({
      mode: 'unknown',
      classNames: [],
      inlineStyles: {},
    }),
    saveCapability,
    saveEnabled,
  };
}

export function resolveSelectionPayload(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  data: InspectRequest
) {
  if (!data?.source) {
    return null;
  }

  const parsedSource = parseSignedSourceToken(state, data.source);

  if (!parsedSource) {
    return null;
  }

  const resolvedFile = resolveWorkspaceFile(state.root, parsedSource.file);

  if (!resolvedFile.ok) {
    return null;
  }

  const saveCapability = issueSaveCapability(state, client);

  return {
    source: parsedSource.source,
    file: parsedSource.file,
    line: parsedSource.line,
    column: parsedSource.column,
    saveCapability,
    saveEnabled: state.saveEnabled,
  } satisfies SelectionPayload;
}

export function handleInspectRequest(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  data: InspectRequest
) {
  const payload = resolveSelectionPayload(state, client, data);

  if (!payload) {
    return null;
  }

  client.send(HAWK_EYE_SELECTION_EVENT, payload);
  return payload;
}

export function resolveStyleAnalysisPayload(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  data: InspectRequest
) {
  const selection = resolveSelectionPayload(state, client, data);

  if (!selection) {
    return null;
  }

  const resolvedFile = resolveWorkspaceFile(state.root, selection.file);

  if (!resolvedFile.ok) {
    return null;
  }

  const mtimeMs = statSync(resolvedFile.value.absoluteFile).mtimeMs;
  const cacheKey = `${resolvedFile.value.absoluteFile}:${mtimeMs}:${selection.line}:${selection.column}`;
  const cachedEntry = styleAnalysisCache.get(cacheKey);

  if (cachedEntry) {
    return cachedEntry.payload;
  }

  let payload: StyleAnalysisPayload;

  try {
    payload = {
      source: selection.source,
      ...(() => {
        const analysis = analyzeStyleAtPosition(
          resolvedFile.value.absoluteFile,
          selection.line,
          selection.column
        );

        return {
          ...analysis,
          fingerprint: createStyleAnalysisFingerprint(analysis),
        };
      })(),
      saveCapability: selection.saveCapability,
      saveEnabled: selection.saveEnabled,
    };
  } catch {
    payload = createUnknownStylePayload(
      selection.source,
      selection.saveCapability,
      selection.saveEnabled
    );
  }

  styleAnalysisCache.set(cacheKey, {
    payload,
  });

  return payload;
}

export function handleStyleAnalysisRequest(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  data: InspectRequest
) {
  const payload = resolveStyleAnalysisPayload(state, client, data);

  if (!payload) {
    return null;
  }

  client.send(HAWK_EYE_STYLE_ANALYSIS_EVENT, payload);
  return payload;
}

export function registerInspectHandler(server: ViteDevServer, state: HawkEyeServerState) {
  server.ws.on(HAWK_EYE_INSPECT_EVENT, (data, client) => {
    handleInspectRequest(state, client, data as InspectRequest);
  });

  server.ws.on(HAWK_EYE_ANALYZE_STYLE_EVENT, (data, client) => {
    handleStyleAnalysisRequest(state, client, data as InspectRequest);
  });
}
