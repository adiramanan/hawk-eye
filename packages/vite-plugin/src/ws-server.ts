import { existsSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { HMRBroadcasterClient, ViteDevServer } from 'vite';
import { analyzeStyleAtPosition, type StyleAnalysisResult, type StyleMode } from './style-analyzer';

export interface InspectRequest {
  source: string;
}

export interface SelectionPayload {
  source: string;
  file: string;
  line: number;
  column: number;
}

export interface StyleAnalysisPayload extends StyleAnalysisResult {
  source: string;
}

export const HAWK_EYE_INSPECT_EVENT = 'hawk-eye:inspect';
export const HAWK_EYE_SELECTION_EVENT = 'hawk-eye:selection';
export const HAWK_EYE_ANALYZE_STYLE_EVENT = 'hawk-eye:analyze-style';
export const HAWK_EYE_STYLE_ANALYSIS_EVENT = 'hawk-eye:style-analysis';

const SOURCE_TOKEN_PATTERN = /^(.*):(\d+):(\d+)$/;
const styleAnalysisCache = new Map<
  string,
  {
    mtimeMs: number;
    payload: StyleAnalysisPayload;
  }
>();

function normalizeFilePath(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

function isPathInsideRoot(root: string, resolvedFile: string) {
  return resolvedFile === root || resolvedFile.startsWith(`${root}${sep}`);
}

function toAbsoluteSelectionFile(root: string, file: string) {
  return resolve(resolve(root), file);
}

function createUnknownStylePayload(source: string): StyleAnalysisPayload {
  return {
    source,
    mode: 'unknown' satisfies StyleMode,
    classNames: [],
    inlineStyles: {},
  };
}

export function resolveSelectionPayload(root: string, data: InspectRequest) {
  if (!data?.source) {
    return null;
  }

  const match = SOURCE_TOKEN_PATTERN.exec(data.source);

  if (!match) {
    return null;
  }

  const [, rawFile, rawLine, rawColumn] = match;
  const line = Number.parseInt(rawLine, 10);
  const column = Number.parseInt(rawColumn, 10);

  if (!Number.isInteger(line) || line < 1 || !Number.isInteger(column) || column < 1) {
    return null;
  }

  const normalizedFile = normalizeFilePath(rawFile);

  if (
    !normalizedFile ||
    normalizedFile.startsWith('/') ||
    normalizedFile === '..' ||
    normalizedFile.startsWith('../')
  ) {
    return null;
  }

  const resolvedRoot = resolve(root);
  const resolvedFile = resolve(resolvedRoot, normalizedFile);

  if (!isPathInsideRoot(resolvedRoot, resolvedFile) || !existsSync(resolvedFile)) {
    return null;
  }

  return {
    source: `${normalizedFile}:${line}:${column}`,
    file: normalizedFile,
    line,
    column,
  } satisfies SelectionPayload;
}

export function handleInspectRequest(
  root: string,
  client: HMRBroadcasterClient,
  data: InspectRequest
) {
  const payload = resolveSelectionPayload(root, data);

  if (!payload) {
    return null;
  }

  client.send(HAWK_EYE_SELECTION_EVENT, payload);

  return payload;
}

export function resolveStyleAnalysisPayload(root: string, data: InspectRequest) {
  const selection = resolveSelectionPayload(root, data);

  if (!selection) {
    return null;
  }

  const absoluteFile = toAbsoluteSelectionFile(root, selection.file);
  const mtimeMs = statSync(absoluteFile).mtimeMs;
  const cachedEntry = styleAnalysisCache.get(selection.source);

  if (cachedEntry && cachedEntry.mtimeMs === mtimeMs) {
    return cachedEntry.payload;
  }

  let payload: StyleAnalysisPayload;

  try {
    payload = {
      source: selection.source,
      ...analyzeStyleAtPosition(absoluteFile, selection.line, selection.column),
    };
  } catch {
    payload = createUnknownStylePayload(selection.source);
  }

  styleAnalysisCache.set(selection.source, {
    mtimeMs,
    payload,
  });

  return payload;
}

export function handleStyleAnalysisRequest(
  root: string,
  client: HMRBroadcasterClient,
  data: InspectRequest
) {
  const payload = resolveStyleAnalysisPayload(root, data);

  if (!payload) {
    return null;
  }

  client.send(HAWK_EYE_STYLE_ANALYSIS_EVENT, payload);

  return payload;
}

export function registerInspectHandler(server: ViteDevServer, root: string) {
  server.ws.on(HAWK_EYE_INSPECT_EVENT, (data, client) => {
    handleInspectRequest(root, client, data as InspectRequest);
  });

  server.ws.on(HAWK_EYE_ANALYZE_STYLE_EVENT, (data, client) => {
    handleStyleAnalysisRequest(root, client, data as InspectRequest);
  });
}
