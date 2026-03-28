import React, { type ReactNode } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface FooterActionButtonProps
  extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick'> {
  active?: boolean;
  ariaLabel: string;
  icon?: ReactNode;
  iconSrc?: string;
  label: string;
  variant?: 'compact' | 'labelled';
  tone?: 'primary' | 'secondary';
  title: string;
  ui: string;
}

export function FooterActionButton({
  active,
  ariaLabel,
  disabled,
  icon,
  iconSrc,
  label,
  onClick,
  variant = 'compact',
  tone = 'secondary',
  title,
  ui,
}: FooterActionButtonProps) {
  const hasIcon = icon != null || Boolean(iconSrc);

  return (
    <button
      aria-label={ariaLabel}
      data-active={active ? 'true' : undefined}
      data-has-icon={hasIcon ? 'true' : 'false'}
      data-hawk-eye-ui={ui}
      data-tone={tone}
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {hasIcon ? (
        <span aria-hidden="true" data-hawk-eye-ui="footer-action-icon-shell">
          {icon ? (
            <span data-hawk-eye-ui="footer-action-icon">{icon}</span>
          ) : (
            <img alt="" data-hawk-eye-ui="footer-action-icon" draggable={false} src={iconSrc} />
          )}
        </span>
      ) : null}
      <span data-hawk-eye-ui="footer-tooltip" role="tooltip" aria-hidden="true">
        {title}
      </span>
      {variant === 'labelled' ? (
        <span data-hawk-eye-ui="footer-action-label">{label}</span>
      ) : (
        <span data-hawk-eye-ui="sr-only">{label}</span>
      )}
    </button>
  );
}
