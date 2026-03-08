export interface InspectRequest {
  source: string;
}

export interface SelectionPayload {
  source: string;
  file: string;
  line: number;
  column: number;
}

export type StyleMode = 'inline' | 'tailwind' | 'unknown';

export interface SelectionDetails extends SelectionPayload {
  styleMode: StyleMode;
  tagName: string;
}

export interface MeasuredElement {
  element: HTMLElement;
  rect: DOMRect;
  source: string;
}
