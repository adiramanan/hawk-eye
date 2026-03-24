/**
 * Event Sourcing for Hawk-Eye
 *
 * Implements event sourcing pattern for change history, undo/redo, and audit trails.
 * Records every state change as an immutable event that can be replayed.
 */

import type { HawkEyeState, StoreAction } from './types';

/**
 * Event source record - immutable record of what changed
 */
export interface SourceEvent {
  // Unique event ID
  id: string;
  // Timestamp when event occurred
  timestamp: number;
  // Action that caused this event
  action: StoreAction;
  // State before change
  stateBefore: HawkEyeState;
  // State after change
  stateAfter: HawkEyeState;
  // User-friendly description
  description: string;
  // Optional metadata (source, user, etc.)
  metadata?: Record<string, any>;
}

/**
 * Event store - records and replays events
 */
export class EventStore {
  private events: SourceEvent[] = [];
  private currentIndex: number = -1;
  private nextId: number = 0;

  /**
   * Record an event
   */
  recordEvent(
    action: StoreAction,
    stateBefore: HawkEyeState,
    stateAfter: HawkEyeState,
    description: string,
    metadata?: Record<string, any>
  ): SourceEvent {
    // Remove any undone events (when user makes a new change after undo)
    if (this.currentIndex < this.events.length - 1) {
      this.events = this.events.slice(0, this.currentIndex + 1);
    }

    const event: SourceEvent = {
      id: `event-${++this.nextId}`,
      timestamp: Date.now(),
      action,
      stateBefore,
      stateAfter,
      description,
      metadata,
    };

    this.events.push(event);
    this.currentIndex = this.events.length - 1;

    return event;
  }

  /**
   * Get all events
   */
  getEvents(): SourceEvent[] {
    return [...this.events];
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): SourceEvent | undefined {
    return this.events.find((e) => e.id === id);
  }

  /**
   * Can undo
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Can redo
   */
  canRedo(): boolean {
    return this.currentIndex < this.events.length - 1;
  }

  /**
   * Get previous event (for undo)
   */
  getPreviousEvent(): SourceEvent | undefined {
    if (this.canUndo()) {
      return this.events[this.currentIndex - 1];
    }
    return undefined;
  }

  /**
   * Get next event (for redo)
   */
  getNextEvent(): SourceEvent | undefined {
    if (this.canRedo()) {
      return this.events[this.currentIndex + 1];
    }
    return undefined;
  }

  /**
   * Undo - move to previous event
   */
  undo(): HawkEyeState | undefined {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.events[this.currentIndex].stateAfter;
    }
    return undefined;
  }

  /**
   * Redo - move to next event
   */
  redo(): HawkEyeState | undefined {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.events[this.currentIndex].stateAfter;
    }
    return undefined;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.events = [];
    this.currentIndex = -1;
    this.nextId = 0;
  }

  /**
   * Get change history (descriptions of what changed)
   */
  getHistory(): Array<{ id: string; description: string; timestamp: number }> {
    return this.events.map((e) => ({
      id: e.id,
      description: e.description,
      timestamp: e.timestamp,
    }));
  }

  /**
   * Replay events to rebuild state
   */
  replayFrom(startIndex: number, endIndex: number): SourceEvent[] {
    return this.events.slice(startIndex, endIndex + 1);
  }

  /**
   * Get current position in history
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get total number of events
   */
  getEventCount(): number {
    return this.events.length;
  }
}

/**
 * Helper to generate event descriptions from actions
 */
export function describeAction(action: StoreAction): string {
  switch (action.type) {
    case 'SET_ENABLED':
      return action.payload ? 'Enabled inspector' : 'Disabled inspector';
    case 'SET_SELECTED':
      return action.payload.element ? 'Selected element' : 'Deselected element';
    case 'SET_HOVERED':
      return action.payload ? 'Hovered element' : 'Unhovered element';
    case 'UPDATE_DRAFT':
      return `Updated draft for ${action.payload.key}`;
    case 'DELETE_DRAFT':
      return `Deleted draft ${action.payload}`;
    case 'CLEAR_DRAFTS':
      return 'Cleared all drafts';
    case 'SET_SAVE_PENDING':
      return action.payload ? 'Save started' : 'Save finished';
    case 'SET_SAVE_RESULT':
      return action.payload?.success ? 'Save succeeded' : 'Save failed';
    case 'SET_SHELL_STATE':
      return `Inspector panel ${action.payload}`;
    case 'SET_DRAFTS':
      return 'Updated drafts';
    default:
      return `Unknown action: ${action.type}`;
  }
}

/**
 * Global event store instance
 */
export const globalEventStore = new EventStore();
