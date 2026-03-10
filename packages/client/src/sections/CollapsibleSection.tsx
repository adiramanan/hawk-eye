import { type ReactNode, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  action?: ReactNode;
  sectionId?: string;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  defaultExpanded = false,
  action,
  sectionId,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section
      data-expanded={expanded ? 'true' : 'false'}
      data-hawk-eye-section={sectionId}
      data-hawk-eye-ui="collapsible-section"
    >
      <button
        data-hawk-eye-ui="collapsible-header"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span data-hawk-eye-ui="collapsible-chevron" />
        <h3 data-hawk-eye-ui="group-title">{title}</h3>
        {action ? (
          <span
            data-hawk-eye-ui="collapsible-action"
            onClick={(event) => event.stopPropagation()}
          >
            {action}
          </span>
        ) : null}
      </button>
      {expanded ? (
        <div data-hawk-eye-ui="collapsible-body">{children}</div>
      ) : null}
    </section>
  );
}
