import {
  HAWK_EYE_ANALYZE_STYLE_EVENT,
  InspectRequest,
  HAWK_EYE_INSPECT_EVENT,
  HAWK_EYE_SAVE_EVENT,
  HAWK_EYE_SAVE_RESULT_EVENT,
  SavePayload,
  SaveResult,
  HAWK_EYE_SELECTION_EVENT,
  SelectionPayload,
  StyleAnalysisPayload,
  HAWK_EYE_STYLE_ANALYSIS_EVENT,
} from '../../../shared/protocol';

export {
  HAWK_EYE_ANALYZE_STYLE_EVENT,
  HAWK_EYE_INSPECT_EVENT,
  HAWK_EYE_SAVE_EVENT,
  HAWK_EYE_SAVE_RESULT_EVENT,
  HAWK_EYE_SELECTION_EVENT,
  HAWK_EYE_STYLE_ANALYSIS_EVENT,
};

interface HotClient {
  on<T>(event: string, cb: (payload: T) => void): void;
  off?<T>(event: string, cb: (payload: T) => void): void;
  send?<T>(event: string, payload?: T): void;
}

declare global {
  var __HAWK_EYE_HOT__: HotClient | undefined;
  var __HAWK_EYE_CLIENT_ID__: string | undefined;
}

function getImportMetaHot() {
  return import.meta.hot;
}

function getHotClient() {
  return globalThis.__HAWK_EYE_HOT__ ?? getImportMetaHot();
}

function createClientId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `hawk-eye-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

function getClientId() {
  if (!globalThis.__HAWK_EYE_CLIENT_ID__) {
    globalThis.__HAWK_EYE_CLIENT_ID__ = createClientId();
  }

  return globalThis.__HAWK_EYE_CLIENT_ID__;
}

export function requestSelection(payload: Omit<InspectRequest, 'clientId'>) {
  getHotClient()?.send?.(HAWK_EYE_INSPECT_EVENT, {
    ...payload,
    clientId: getClientId(),
  } satisfies InspectRequest);
}

export function requestStyleAnalysis(payload: Omit<InspectRequest, 'clientId'>) {
  getHotClient()?.send?.(HAWK_EYE_ANALYZE_STYLE_EVENT, {
    ...payload,
    clientId: getClientId(),
  } satisfies InspectRequest);
}

export function requestSave(payload: Omit<SavePayload, 'clientId'>) {
  getHotClient()?.send?.(HAWK_EYE_SAVE_EVENT, {
    ...payload,
    clientId: getClientId(),
  } satisfies SavePayload);
}

export function subscribeToSelection(cb: (payload: SelectionPayload) => void) {
  const hotClient = getHotClient();

  if (!hotClient) {
    return () => undefined;
  }

  hotClient.on(HAWK_EYE_SELECTION_EVENT, cb);

  return () => {
    hotClient.off?.(HAWK_EYE_SELECTION_EVENT, cb);
  };
}

export function subscribeToStyleAnalysis(cb: (payload: StyleAnalysisPayload) => void) {
  const hotClient = getHotClient();

  if (!hotClient) {
    return () => undefined;
  }

  hotClient.on(HAWK_EYE_STYLE_ANALYSIS_EVENT, cb);

  return () => {
    hotClient.off?.(HAWK_EYE_STYLE_ANALYSIS_EVENT, cb);
  };
}

export function subscribeToSaveResult(cb: (payload: SaveResult) => void) {
  const hotClient = getHotClient();

  if (!hotClient) {
    return () => undefined;
  }

  hotClient.on(HAWK_EYE_SAVE_RESULT_EVENT, cb);

  return () => {
    hotClient.off?.(HAWK_EYE_SAVE_RESULT_EVENT, cb);
  };
}
