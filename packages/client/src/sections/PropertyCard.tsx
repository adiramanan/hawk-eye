import type { ReactNode } from 'react';

interface PropertyCardProps {
  label: string;
  meta: string;
  dirty: boolean;
  invalid: boolean;
  children: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  propertyId?: string;
  span?: 'default' | 'full';
}

export function PropertyCard({
  label,
  meta,
  dirty,
  invalid,
  children,
  action,
  compact = false,
  propertyId,
  span = 'default',
}: PropertyCardProps) {
  return (
    <div
      data-compact={compact ? 'true' : 'false'}
      data-dirty={dirty ? 'true' : 'false'}
      data-hawk-eye-ui="control"
      data-invalid={invalid ? 'true' : 'false'}
      data-property-id={propertyId}
      data-span={span}
    >
      <span data-hawk-eye-ui="control-head">
        <span data-hawk-eye-ui="control-label">{label}</span>
        {action}
      </span>

      {children}

      <span data-hawk-eye-ui="control-meta">{meta}</span>
    </div>
  );
}
