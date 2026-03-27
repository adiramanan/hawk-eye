import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface FooterActionButtonProps
  extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick'> {
  active?: boolean;
  ariaLabel: string;
  iconSrc: string;
  label: string;
  tone?: 'primary' | 'secondary';
  title: string;
  ui: string;
}

export function FooterActionButton({
  active,
  ariaLabel,
  disabled,
  iconSrc,
  label,
  onClick,
  tone = 'secondary',
  title,
  ui,
}: FooterActionButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      data-active={active ? 'true' : undefined}
      data-hawk-eye-ui={ui}
      data-tone={tone}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span aria-hidden="true" data-hawk-eye-ui="footer-action-icon-shell">
        <img alt="" data-hawk-eye-ui="footer-action-icon" draggable={false} src={iconSrc} />
      </span>
      <span data-hawk-eye-ui="footer-action-label">{label}</span>
    </button>
  );
}
