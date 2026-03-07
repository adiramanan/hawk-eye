import React from 'react';

export interface DesignToolProps {
  // Configuration options to be defined during Phase 1
}

/**
 * DesignTool Component
 *
 * Main embeddable component that renders the floating trigger icon
 * for activating the design tool inspector mode.
 *
 * Phase 1: Implement hover overlay, element selection, and WebSocket bridge
 */
export function DesignTool(_props: DesignToolProps) {
  return (
    <div data-testid="hawk-eye-design-tool">
      {/* Floating trigger icon — to be implemented in Phase 1 */}
      <button>Design</button>
    </div>
  );
}
