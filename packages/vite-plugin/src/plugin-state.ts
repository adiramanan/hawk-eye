import { createHash, randomBytes } from 'node:crypto';
import type { HMRBroadcasterClient } from 'vite';

export interface HawkEyePluginOptions {
  enableSave?: boolean;
}

export interface HawkEyeServerState {
  root: string;
  saveCapabilities: WeakMap<HMRBroadcasterClient, string>;
  saveEnabled: boolean;
  sourceTokenSecret: string;
}

const SOURCE_SIGNATURE_LENGTH = 16;

function createSignature(secret: string, value: string) {
  return createHash('sha256')
    .update(`${secret}:${value}`)
    .digest('hex')
    .slice(0, SOURCE_SIGNATURE_LENGTH);
}

export function createHawkEyeServerState(
  options: HawkEyePluginOptions = {}
): HawkEyeServerState {
  return {
    root: process.cwd(),
    saveCapabilities: new WeakMap(),
    saveEnabled: options.enableSave === true,
    sourceTokenSecret: randomBytes(24).toString('hex'),
  };
}

export function updateHawkEyeServerRoot(state: HawkEyeServerState, root: string) {
  state.root = root;
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

export function issueSaveCapability(state: HawkEyeServerState, client: HMRBroadcasterClient) {
  if (!state.saveEnabled) {
    return null;
  }

  const existingCapability = state.saveCapabilities.get(client);

  if (existingCapability) {
    return existingCapability;
  }

  const capability = randomBytes(24).toString('hex');
  state.saveCapabilities.set(client, capability);
  return capability;
}

export function hasValidSaveCapability(
  state: HawkEyeServerState,
  client: HMRBroadcasterClient,
  capability: string | undefined
) {
  if (!state.saveEnabled || !capability) {
    return false;
  }

  return state.saveCapabilities.get(client) === capability;
}
