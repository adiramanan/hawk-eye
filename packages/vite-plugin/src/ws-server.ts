import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { HMRBroadcasterClient, ViteDevServer } from 'vite';

export interface InspectRequest {
  source: string;
}

export interface SelectionPayload {
  source: string;
  file: string;
  line: number;
  column: number;
}

export const HAWK_EYE_INSPECT_EVENT = 'hawk-eye:inspect';
export const HAWK_EYE_SELECTION_EVENT = 'hawk-eye:selection';

const SOURCE_TOKEN_PATTERN = /^(.*):(\d+):(\d+)$/;

function normalizeFilePath(filePath: string) {
  return filePath.replace(/\\/g, '/');
}

function isPathInsideRoot(root: string, resolvedFile: string) {
  return resolvedFile === root || resolvedFile.startsWith(`${root}${sep}`);
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

export function registerInspectHandler(server: ViteDevServer, root: string) {
  server.ws.on(HAWK_EYE_INSPECT_EVENT, (data, client) => {
    handleInspectRequest(root, client, data as InspectRequest);
  });
}
