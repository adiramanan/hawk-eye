import type { InspectRequest, SelectionPayload, StyleAnalysisPayload } from './types';

export const HAWK_EYE_INSPECT_EVENT = 'hawk-eye:inspect';
export const HAWK_EYE_SELECTION_EVENT = 'hawk-eye:selection';
export const HAWK_EYE_ANALYZE_STYLE_EVENT = 'hawk-eye:analyze-style';
export const HAWK_EYE_STYLE_ANALYSIS_EVENT = 'hawk-eye:style-analysis';

interface HotClient {
  on<T>(event: string, cb: (payload: T) => void): void;
  off?<T>(event: string, cb: (payload: T) => void): void;
  send?(event: string, payload?: InspectRequest): void;
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
