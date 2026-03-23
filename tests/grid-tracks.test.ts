import { describe, expect, it } from 'vitest';
import {
  parseGridTracks,
  serializeGridTracks,
} from '../packages/client/src/utils/grid-tracks';

describe('grid track utilities', () => {
  it('expands repeat fill tracks into editable definitions', () => {
    const parsed = parseGridTracks('repeat(3, 1fr)', 'columns');

    expect(parsed.lossy).toBe(false);
    expect(parsed.tracks).toEqual([
      { mode: 'fill', unit: 'fr', value: 1 },
      { mode: 'fill', unit: 'fr', value: 1 },
      { mode: 'fill', unit: 'fr', value: 1 },
    ]);
    expect(serializeGridTracks(parsed.tracks)).toBe('1fr 1fr 1fr');
  });

  it('round-trips mixed fill tracks', () => {
    const parsed = parseGridTracks('0.75fr 1fr', 'columns');

    expect(parsed.lossy).toBe(false);
    expect(parsed.tracks).toEqual([
      { mode: 'fill', unit: 'fr', value: 0.75 },
      { mode: 'fill', unit: 'fr', value: 1 },
    ]);
    expect(serializeGridTracks(parsed.tracks)).toBe('0.75fr 1fr');
  });

  it('round-trips fixed tracks', () => {
    const parsed = parseGridTracks('120px 240px', 'columns');

    expect(parsed.lossy).toBe(false);
    expect(parsed.tracks).toEqual([
      { mode: 'fixed', unit: 'px', value: 120 },
      { mode: 'fixed', unit: 'px', value: 240 },
    ]);
    expect(serializeGridTracks(parsed.tracks)).toBe('120px 240px');
  });

  it('round-trips hug tracks', () => {
    const parsed = parseGridTracks('fit-content(72px) fit-content(96px)', 'rows');

    expect(parsed.lossy).toBe(false);
    expect(parsed.tracks).toEqual([
      { mode: 'hug', unit: 'px', value: 72 },
      { mode: 'hug', unit: 'px', value: 96 },
    ]);
    expect(serializeGridTracks(parsed.tracks)).toBe('fit-content(72px) fit-content(96px)');
  });

  it('normalizes unsupported track CSS into editable tracks', () => {
    const parsed = parseGridTracks('minmax(120px, 1fr) 2fr', 'columns');

    expect(parsed.lossy).toBe(true);
    expect(parsed.tracks).toEqual([
      { mode: 'fill', unit: 'fr', value: 1 },
      { mode: 'fill', unit: 'fr', value: 2 },
    ]);
    expect(serializeGridTracks(parsed.tracks)).toBe('1fr 2fr');
  });
});
