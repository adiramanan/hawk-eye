import { createHash, randomBytes } from 'node:crypto';
import type { StyleAnalysisPayload } from '../../../shared/protocol';

export interface HawkEyePluginOptions {
  enableSave?: boolean;
}

export type CachedStyleAnalysis = Omit<
  StyleAnalysisPayload,
  'saveCapability' | 'saveEnabled' | 'source'
>;

export interface HawkEyeServerState {
  root: string;
  saveCapabilities: Map<string, string>;
  saveEnabled: boolean;
  styleAnalysisCache: Map<string, CachedStyleAnalysis>;
  sourceTokenSecret: string;
}

const SOURCE_SIGNATURE_LENGTH = 16;
const MAX_ACTIVE_SAVE_CAPABILITIES = 64;
const MAX_CACHED_STYLE_ANALYSES = 128;

function createSignature(secret: string, value: string) {
  return createHash('sha256')
    .update(`${secret}:${value}`)
    .digest('hex')
    .slice(0, SOURCE_SIGNATURE_LENGTH);
}

export function createHawkEyeServerState(options: HawkEyePluginOptions = {}): HawkEyeServerState {
  return {
    root: process.cwd(),
    saveCapabilities: new Map(),
    saveEnabled: options.enableSave === true,
    styleAnalysisCache: new Map(),
    sourceTokenSecret: randomBytes(24).toString('hex'),
  };
}

export function updateHawkEyeServerRoot(state: HawkEyeServerState, root: string) {
  state.root = root;
  state.styleAnalysisCache.clear();
}

export function createSignedSourceToken(
  state: HawkEyeServerState,
  relativePath: string,
  line: number,
  column: number
) {
  const unsignedSource = `${relativePath}:${line}:${column}`;
  return `${unsignedSource}:${createSignature(state.sourceTokenSecret, unsignedSource)}`;
}

export function parseSignedSourceToken(state: HawkEyeServerState, source: string) {
  const match = /^(.*):(\d+):(\d+):([a-f0-9]+)$/.exec(source);

  if (!match) {
    return null;
  }

  const [, file, rawLine, rawColumn, signature] = match;
  const line = Number.parseInt(rawLine, 10);
  const column = Number.parseInt(rawColumn, 10);

  if (!file || !Number.isInteger(line) || !Number.isInteger(column) || line < 1 || column < 1) {
    return null;
  }

  const unsignedSource = `${file}:${line}:${column}`;

  if (createSignature(state.sourceTokenSecret, unsignedSource) !== signature) {
    return null;
  }

  return {
    column,
    file,
    line,
    source,
    unsignedSource,
  };
}

function trimSaveCapabilities(state: HawkEyeServerState) {
  while (state.saveCapabilities.size > MAX_ACTIVE_SAVE_CAPABILITIES) {
    const oldestClientId = state.saveCapabilities.keys().next().value;

    if (!oldestClientId) {
      break;
    }

    state.saveCapabilities.delete(oldestClientId);
  }
}

export function issueSaveCapability(state: HawkEyeServerState, clientId: string) {
  if (!state.saveEnabled) {
    return null;
  }

  const existingCapability = state.saveCapabilities.get(clientId);

  if (existingCapability) {
    state.saveCapabilities.delete(clientId);
    state.saveCapabilities.set(clientId, existingCapability);
    return existingCapability;
  }

  const capability = randomBytes(24).toString('hex');
  state.saveCapabilities.set(clientId, capability);
  trimSaveCapabilities(state);
  return capability;
}

export function hasValidSaveCapability(
  state: HawkEyeServerState,
  clientId: string | undefined,
  capability: string | undefined
) {
  if (!state.saveEnabled || !clientId || !capability) {
    return false;
  }

  return state.saveCapabilities.get(clientId) === capability;
}

function trimStyleAnalysisCache(state: HawkEyeServerState) {
  while (state.styleAnalysisCache.size > MAX_CACHED_STYLE_ANALYSES) {
    const oldestKey = state.styleAnalysisCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    state.styleAnalysisCache.delete(oldestKey);
  }
}

export function getCachedStyleAnalysis(state: HawkEyeServerState, key: string) {
  const cachedAnalysis = state.styleAnalysisCache.get(key);

  if (!cachedAnalysis) {
    return null;
  }

  state.styleAnalysisCache.delete(key);
  state.styleAnalysisCache.set(key, cachedAnalysis);
  return cachedAnalysis;
}

export function cacheStyleAnalysis(
  state: HawkEyeServerState,
  key: string,
  analysis: CachedStyleAnalysis
) {
  if (state.styleAnalysisCache.has(key)) {
    state.styleAnalysisCache.delete(key);
  }

  state.styleAnalysisCache.set(key, analysis);
  trimStyleAnalysisCache(state);
}
