import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseScrubOptions {
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange(value: number): void;
}

export interface UseScrubResult {
  isScrubbing: boolean;
  labelProps: {
    onPointerDown(e: React.PointerEvent<HTMLElement>): void;
    'data-hawk-eye-ui': 'scrub-label';
  };
}

export function useScrub({ value, step = 1, min, max, onChange }: UseScrubOptions): UseScrubResult {
  const [isScrubbing, setIsScrubbing] = useState(false);

  const scrubRef = useRef<{ startX: number; startValue: number } | null>(null);
  const shiftRef = useRef(false);
  const stepRef = useRef(step);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const onChangeRef = useRef(onChange);

  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { minRef.current = min; }, [min]);
  useEffect(() => { maxRef.current = max; }, [max]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      scrubRef.current = { startX: e.clientX, startValue: value };
      shiftRef.current = e.shiftKey;
      document.documentElement.style.setProperty('cursor', 'ew-resize', 'important');
      setIsScrubbing(true);
    },
    [value]
  );

  useEffect(() => {
    if (!isScrubbing) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift') shiftRef.current = true;
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Shift') shiftRef.current = false;
    }
    function handlePointerMove(e: PointerEvent) {
      if (!scrubRef.current) return;
      const effectiveStep = shiftRef.current ? stepRef.current * 10 : stepRef.current;
      const rawDelta = (e.clientX - scrubRef.current.startX) * effectiveStep;
      let next = scrubRef.current.startValue + rawDelta;
      if (minRef.current !== undefined) next = Math.max(minRef.current, next);
      if (maxRef.current !== undefined) next = Math.min(maxRef.current, next);
      // Round to avoid floating point noise; match step precision
      const decimals = effectiveStep < 1 ? String(effectiveStep).split('.')[1]?.length ?? 2 : 0;
      next = Number(next.toFixed(decimals));
      onChangeRef.current(next);
    }
    function handlePointerUp() {
      scrubRef.current = null;
      document.documentElement.style.removeProperty('cursor');
      setIsScrubbing(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      // Safety cleanup in case effect re-runs while scrubbing
      document.documentElement.style.removeProperty('cursor');
    };
  }, [isScrubbing]);

  return {
    isScrubbing,
    labelProps: {
      onPointerDown: handlePointerDown,
      'data-hawk-eye-ui': 'scrub-label',
    },
  };
}
