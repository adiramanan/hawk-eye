import { type ReactNode, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
  action?: ReactNode;
  sectionId?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultExpanded = false,
  forceExpanded = false,
  action,
  sectionId,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExpanded = forceExpanded || expanded;

  return (
    <section
      data-expanded={isExpanded ? 'true' : 'false'}
      data-hawk-eye-section={sectionId}
      data-hawk-eye-ui="collapsible-section"
    >
      <button
        data-hawk-eye-ui="collapsible-header"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span data-hawk-eye-ui="collapsible-chevron" />
        <div data-hawk-eye-ui="section-heading">
          <h3 data-hawk-eye-ui="group-title">{title}</h3>
          {subtitle ? <span data-hawk-eye-ui="section-subtitle">{subtitle}</span> : null}
        </div>
        {action ? (
          <span
            data-hawk-eye-ui="collapsible-action"
            onClick={(event) => event.stopPropagation()}
          >
            {action}
          </span>
        ) : null}
      </button>
      {isExpanded ? (
        <div data-hawk-eye-ui="collapsible-body">{children}</div>
      ) : null}
    </section>
  );
}
