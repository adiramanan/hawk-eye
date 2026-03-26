/**
 * Icon Component System
 *
 * Provides a unified icon system matching the Figma design.
 * Icons support 3 states: 'normal' (outline), 'inactive' (grayed), 'active' (filled blue)
 */

import React from 'react';

export type IconType =
  | 'refresh'
  | 'hide'
  | 'roller-brush'
  | 'padding-lock'
  | 'link-broken'
  | 'x-square'
  | 'grid'
  | 'align-top'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'stop-square';

export type IconState = 'normal' | 'inactive' | 'active';

interface IconProps {
  type: IconType;
  state?: IconState;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Get color for icon state
 */
function getIconColor(state: IconState): string {
  switch (state) {
    case 'normal':
      return 'currentColor';
    case 'inactive':
      return 'var(--color-text-disabled)';
    case 'active':
      return 'var(--color-accent)';
  }
}

/**
 * Get opacity/fill style for icon state
 */
function getIconStyle(state: IconState): React.CSSProperties {
  switch (state) {
    case 'active':
      return { fill: 'currentColor' };
    default:
      return { fill: 'none' };
  }
}

// Icon SVG Components

function RefreshIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <path
        d="M2 10a8 8 0 0 1 8-8v3m0-3a8 8 0 1 1 0 16v-3m0 3a8 8 0 0 0 8-8h-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HideIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <path
        d="M1 10s2.5-4 9-4 9 4 9 4-2.5 4-9 4-9-4-9-4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2 2l16 16"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RollerBrushIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <rect
        x="2"
        y="2"
        width="10"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M12 3v6M2 9h10v7a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaddingLockIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <rect
        x="5"
        y="8"
        width="10"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 8V5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkBrokenIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <path
        d="M9 5.5l.47-.47a4 4 0 0 1 5.66 5.66l-.47.47M11.5 8.5a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1.13-1.13M6 14l4-4m4-4l-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XSquareIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <rect
        x="2"
        y="2"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="2" x2="7" y2="18" stroke="currentColor" strokeWidth="1.4" />
      <line x1="13" y1="2" x2="13" y2="18" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AlignTopIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <line x1="2" y1="2" x2="18" y2="2" stroke="currentColor" strokeWidth="1.4" />
      <rect
        x="3"
        y="5"
        width="3"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="8"
        y="5"
        width="3"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="13"
        y="5"
        width="3"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function AlignLeftIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <line x1="2" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="1.4" />
      <rect
        x="5"
        y="3"
        width="6"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="5"
        y="8"
        width="10"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="5"
        y="13"
        width="8"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function AlignCenterIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="1.4" />
      <rect
        x="7"
        y="3"
        width="6"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="3"
        y="8"
        width="14"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="5"
        y="13"
        width="10"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function AlignRightIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <line x1="18" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.4" />
      <rect
        x="9"
        y="3"
        width="6"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="5"
        y="8"
        width="10"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="7"
        y="13"
        width="8"
        height="3"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function AlignJustifyIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <line x1="2" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function StopSquareIcon({ state, size = 20 }: { state: IconState; size?: number }) {
  const color = getIconColor(state);
  const style = getIconStyle(state);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...style, color }}
    >
      <rect
        x="2"
        y="2"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect x="6" y="6" width="8" height="8" fill="currentColor" />
    </svg>
  );
}

// Icon lookup table
const ICON_MAP: Record<IconType, React.ComponentType<{ state: IconState; size?: number }>> = {
  'refresh': RefreshIcon,
  'hide': HideIcon,
  'roller-brush': RollerBrushIcon,
  'padding-lock': PaddingLockIcon,
  'link-broken': LinkBrokenIcon,
  'x-square': XSquareIcon,
  'grid': GridIcon,
  'align-top': AlignTopIcon,
  'align-left': AlignLeftIcon,
  'align-center': AlignCenterIcon,
  'align-right': AlignRightIcon,
  'align-justify': AlignJustifyIcon,
  'stop-square': StopSquareIcon,
};

/**
 * Icon Component
 *
 * Renders an icon with a specific state (normal, inactive, active)
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  function Icon({ type, state = 'normal', size = 20, className, title }, ref) {
    const IconComponent = ICON_MAP[type];

    if (!IconComponent) {
      console.warn(`Unknown icon type: ${type}`);
      return null;
    }

    return (
      <span
        ref={ref as any}
        className={className}
        data-hawk-eye-ui="icon"
        data-icon-type={type}
        data-icon-state={state}
        title={title}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <IconComponent state={state} size={size} />
      </span>
    );
  }
);

Icon.displayName = 'Icon';
