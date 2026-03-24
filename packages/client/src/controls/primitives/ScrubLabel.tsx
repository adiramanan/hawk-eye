/**
 * ScrubLabel Primitive
 *
 * Adds scrubbing (drag) behavior to any label.
 * Detects click vs drag to avoid interfering with clicks.
 */

import React, { useState, useRef, useCallback } from 'react';

export interface ScrubLabelProps {
  label?: string;
  onScrubDelta: (delta: number) => void;
  multiplier?: number;
  children: React.ReactNode;
  disabled?: boolean;
}

const DRAG_THRESHOLD = 3; // pixels

/**
 * ScrubLabel - Adds scrubbing to a label
 * Dragging left/right on the label emits delta values
 */
export const ScrubLabel = React.forwardRef<HTMLLabelElement, ScrubLabelProps>(
  function ScrubLabel({ label, onScrubDelta, multiplier = 1, children, disabled = false }, ref) {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragAccum = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (disabled) return;
      dragStartX.current = e.clientX;
      dragAccum.current = 0;
      setIsDragging(true);
    }, [disabled]);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging) return;

        const delta = e.clientX - dragStartX.current;

        if (Math.abs(delta) < DRAG_THRESHOLD) return;

        dragAccum.current += delta;
        dragStartX.current = e.clientX;

        // Emit delta every 1px dragged
        if (Math.abs(dragAccum.current) >= 1) {
          const steps = Math.floor(dragAccum.current);
          onScrubDelta(steps * multiplier);
          dragAccum.current = 0;
        }
      },
      [isDragging, onScrubDelta, multiplier]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Attach listeners to document while dragging
    React.useEffect(() => {
      if (!isDragging) return;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <label
        ref={ref}
        onMouseDown={handleMouseDown}
        data-hawk-eye-control="scrub-label"
        style={{
          cursor: isDragging ? 'col-resize' : 'w-resize',
          userSelect: 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {label && <span style={{ marginRight: 'var(--spacing-xs)' }}>{label}</span>}
        {children}
      </label>
    );
  }
);

ScrubLabel.displayName = 'ScrubLabel';
