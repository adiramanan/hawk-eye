import { describe, expect, it, vi } from 'vitest';
import {
  HAWK_EYE_SELECTION_EVENT,
  resolveSelectionPayload,
  handleInspectRequest,
} from '../packages/vite-plugin/src/ws-server';

describe('inspect request handling', () => {
  it('returns canonical selection payloads for in-root files', () => {
    const payload = resolveSelectionPayload(process.cwd(), {
      source: 'demo/src/App.tsx:1:1',
    });

    expect(payload).toEqual({
      source: 'demo/src/App.tsx:1:1',
      file: 'demo/src/App.tsx',
      line: 1,
      column: 1,
    });
  });

  it('ignores out-of-root paths safely', () => {
    const payload = resolveSelectionPayload(process.cwd(), {
      source: '../secrets.tsx:1:1',
    });

    expect(payload).toBeNull();
  });

  it('sends selection payloads back to the requesting client', () => {
    const client = {
      send: vi.fn(),
    };

    const payload = handleInspectRequest(process.cwd(), client, {
      source: 'demo/src/App.tsx:1:1',
    });

    expect(payload?.file).toBe('demo/src/App.tsx');
    expect(client.send).toHaveBeenCalledWith(HAWK_EYE_SELECTION_EVENT, payload);
  });
});
