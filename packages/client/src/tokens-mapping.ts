/**
 * Token Mapping for Legacy --he-* Variables
 *
 * Maps legacy Hawk-Eye CSS variables to the new design system tokens.
 * This serves as a bridge during the transition to the tokenized system.
 */

export const tokenMappings = {
  // Colors - mapped to new tokens
  colors: {
    '--he-bg': 'var(--color-bg)',
    '--he-fg': 'var(--color-text-primary)',
    '--he-panel-border': 'var(--color-border)',
    '--he-divider': 'var(--color-border)',
    '--he-input': 'var(--color-input-bg)',
    '--he-input-hover': 'var(--color-input-hover)',
    '--he-label': 'var(--color-text-secondary)',
    '--he-muted': 'var(--color-text-tertiary)',
    '--he-section-title': 'var(--color-text-secondary)',
    '--he-accent': 'var(--color-accent)',
    '--he-dirty': 'var(--color-warning)',
    '--he-destructive': 'var(--color-error)',
    '--he-trigger-bg': 'var(--color-bg-secondary)',
    '--he-trigger-hover': 'var(--color-bg-tertiary)',
    '--he-ring': 'var(--color-accent)',
  },

  // Spacing - mapped to new tokens
  spacing: {
    '4px': 'var(--spacing-xs)',
    '6px': 'var(--spacing-sm)',
    '8px': 'var(--spacing-base)',
    '12px': 'var(--spacing-md)',
    '16px': 'var(--spacing-lg)',
    '24px': 'var(--spacing-xl)',
    '32px': 'var(--spacing-2xl)',
  },

  // Typography - mapped to new tokens
  typography: {
    '11px': 'var(--font-size-xs)',
    '12px': 'var(--font-size-sm)',
    '16px': 'var(--font-size-base)',
    '17px': 'var(--font-size-lg)',
    '500': 'var(--font-weight-base)',
    '600': 'var(--font-weight-strong)',
    '700': 'var(--font-weight-bold)',
  },

  // Border radius - mapped to new tokens
  radius: {
    '3px': 'var(--radius-xs)',
    '4px': 'var(--radius-sm)',
    '8px': 'var(--radius-md)',
    '20px': 'var(--radius-lg)',
    '999px': 'var(--radius-full)',
  },

  // Motion - mapped to new tokens
  motion: {
    '140ms': 'var(--duration-fast)',
    '180ms': 'var(--duration-base)',
    '220ms': 'var(--duration-slow)',
    '280ms': 'var(--duration-slower)',
    '780ms': 'var(--duration-slowest)',
  },
};

/**
 * Generate CSS variable replacements for the given object.
 * Usage in styles.ts:
 *   :host {
 *     --he-bg: rgba(0, 0, 0, 0.85);
 *   }
 *
 * Should be updated to reference tokens.css variables.
 */
export function getColorTokenCSS() {
  return Object.entries(tokenMappings.colors)
    .map(([legacyVar, newVar]) => `${legacyVar}: ${newVar};`)
    .join('\n    ');
}
