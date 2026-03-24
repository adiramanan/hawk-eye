import { type ReactNode, useEffect } from 'react';
import { hawkEyeStyles } from '../../packages/client/src/styles';

/**
 * Transforms hawkEyeStyles (written for Shadow DOM :host context) into
 * a stylesheet that works in the host page for the Design Lab.
 *
 * Changes:
 * - `:host { ... }` → `.he-dl { ... }` so CSS variables cascade from the wrapper div
 * - Remove `all: initial` (would nuke inherited styles in host context)
 * - Override positioning rules that rely on Shadow DOM stacking
 */
const playgroundCss =
  hawkEyeStyles
    .replace(':host', '.he-dl')
    .replace('all: initial;', '') +
  `
  /* Design Lab overrides: un-fix elements that are fixed in the inspector overlay */
  .he-dl [data-hawk-eye-ui="root"] {
    position: relative !important;
    inset: auto !important;
    pointer-events: auto !important;
    z-index: auto !important;
  }
  .he-dl [data-hawk-eye-ui="surface"] {
    position: static !important;
  }
  .he-dl [data-hawk-eye-ui="panel"] {
    position: relative !important;
    max-height: none !important;
    height: auto !important;
    top: auto !important;
    right: auto !important;
    box-shadow: none !important;
  }
  .he-dl [data-hawk-eye-ui="outline"],
  .he-dl [data-hawk-eye-ui="measure"] {
    display: none !important;
  }
`;

export function DesignLabTheme({ children }: { children: ReactNode }) {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'hawk-eye-design-lab-styles';
    style.textContent = playgroundCss;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return <div className="he-dl">{children}</div>;
}
