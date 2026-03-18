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
}

function getHotClient() {
  return globalThis.__HAWK_EYE_HOT__ ?? (import.meta as ImportMeta & { hot?: HotClient }).hot;
}

export function requestSelection(payload: InspectRequest) {
  getHotClient()?.send?.(HAWK_EYE_INSPECT_EVENT, payload);
}

export function requestStyleAnalysis(payload: InspectRequest) {
  getHotClient()?.send?.(HAWK_EYE_ANALYZE_STYLE_EVENT, payload);
}

export function requestSave(payload: SavePayload) {
  getHotClient()?.send?.(HAWK_EYE_SAVE_EVENT, payload);
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
