import type { InspectRequest, SelectionPayload } from './types';

export const HAWK_EYE_INSPECT_EVENT = 'hawk-eye:inspect';
export const HAWK_EYE_SELECTION_EVENT = 'hawk-eye:selection';

interface HotClient {
  on(event: string, cb: (payload: SelectionPayload) => void): void;
  off?(event: string, cb: (payload: SelectionPayload) => void): void;
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
