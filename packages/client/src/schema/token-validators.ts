/**
 * Type-Safe Token Validation
 *
 * Ensures all CSS custom properties are properly defined and used.
 */

/**
 * Color token types
 */
export type ColorToken =
  | 'color-accent'
  | 'color-text-primary'
  | 'color-text-secondary'
  | 'color-text-muted'
  | 'color-border'
  | 'color-success'
  | 'color-warning'
  | 'color-error'
  | 'color-bg'
  | 'color-surface-base'
  | 'color-input-bg'
  | 'color-input-border';

/**
 * Spacing token types
 */
export type SpacingToken =
  | 'spacing-xs'
  | 'spacing-sm'
  | 'spacing-base'
  | 'spacing-md'
  | 'spacing-lg'
  | 'spacing-xl'
  | 'spacing-2xl'
  | 'spacing-3xl'
  | 'spacing-1px'
  | 'spacing-2px'
  | 'spacing-10px'
  | 'spacing-14px'
  | 'spacing-25px'
  | 'spacing-28px';

/**
 * Shadow token types
 */
export type ShadowToken = 'shadow-sm' | 'shadow-md' | 'shadow-lg' | 'shadow-xl';

/**
 * Radius token types
 */
export type RadiusToken = 'radius-xs' | 'radius-sm' | 'radius-md' | 'radius-lg' | 'radius-full';

/**
 * All available token types (union)
 */
export type DesignToken = ColorToken | SpacingToken | ShadowToken | RadiusToken;

/**
 * Token validator - ensures token exists and is properly formatted
 */
export class TokenValidator {
  private colorTokens: Set<ColorToken>;
  private spacingTokens: Set<SpacingToken>;
  private shadowTokens: Set<ShadowToken>;
  private radiusTokens: Set<RadiusToken>;

  constructor() {
    this.colorTokens = new Set([
      'color-accent',
      'color-text-primary',
      'color-text-secondary',
      'color-text-muted',
      'color-border',
      'color-success',
      'color-warning',
      'color-error',
      'color-bg',
      'color-surface-base',
      'color-input-bg',
      'color-input-border',
    ]);

    this.spacingTokens = new Set([
      'spacing-xs',
      'spacing-sm',
      'spacing-base',
      'spacing-md',
      'spacing-lg',
      'spacing-xl',
      'spacing-2xl',
      'spacing-3xl',
      'spacing-1px',
      'spacing-2px',
      'spacing-10px',
      'spacing-14px',
      'spacing-25px',
      'spacing-28px',
    ]);

    this.shadowTokens = new Set(['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl']);

    this.radiusTokens = new Set(['radius-xs', 'radius-sm', 'radius-md', 'radius-lg', 'radius-full']);
  }

  /**
   * Validate color token exists
   */
  isValidColorToken(token: string): token is ColorToken {
    return this.colorTokens.has(token as ColorToken);
  }

  /**
   * Validate spacing token exists
   */
  isValidSpacingToken(token: string): token is SpacingToken {
    return this.spacingTokens.has(token as SpacingToken);
  }

  /**
   * Validate shadow token exists
   */
  isValidShadowToken(token: string): token is ShadowToken {
    return this.shadowTokens.has(token as ShadowToken);
  }

  /**
   * Validate radius token exists
   */
  isValidRadiusToken(token: string): token is RadiusToken {
    return this.radiusTokens.has(token as RadiusToken);
  }

  /**
   * Get token CSS variable name
   */
  getTokenVariable<T extends DesignToken>(token: T): `var(--${T})` {
    return `var(--${token})` as const;
  }

  /**
   * Validate all color tokens
   */
  getAllColorTokens(): ColorToken[] {
    return Array.from(this.colorTokens);
  }

  /**
   * Validate all spacing tokens
   */
  getAllSpacingTokens(): SpacingToken[] {
    return Array.from(this.spacingTokens);
  }
}

/**
 * Global token validator instance
 */
export const tokenValidator = new TokenValidator();

/**
 * Type-safe token getter
 */
export function getToken<T extends DesignToken>(token: T): string {
  // Validate token exists
  if (
    !tokenValidator.isValidColorToken(token) &&
    !tokenValidator.isValidSpacingToken(token) &&
    !tokenValidator.isValidShadowToken(token) &&
    !tokenValidator.isValidRadiusToken(token)
  ) {
    throw new Error(`Invalid token: ${token}`);
  }

  return `var(--${token})`;
}
