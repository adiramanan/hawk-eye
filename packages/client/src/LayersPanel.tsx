import { useEffect, useState } from 'react';
import { HAWK_EYE_SOURCE_ATTRIBUTE } from '../../../shared/protocol';
import { createInspectableElementKey } from './drafts';

interface LayerNode {
  element: HTMLElement;
  instanceKey: string;
  label: string;
  source: string;
  tagName: string;
  children: LayerNode[];
  depth: number;
}

interface LayersPanelProps {
  selectedInstanceKey: string | null;
  onLayerCount?(count: number): void;
  onSelectByKey(instanceKey: string): void;
}

function makeLabel(source: string): string {
  const parts = source.split(':');
  const line = parts[parts.length - 2];
  const file = parts.slice(0, -2).join(':');
  const fileParts = file.split('/');
  const basename = fileParts[fileParts.length - 1] ?? file;
  return `${basename}:${line}`;
}

const TEXT_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'span', 'a', 'button', 'label', 'li',
  'caption', 'figcaption', 'dt', 'dd',
  'code', 'em', 'strong', 'small', 'blockquote', 'legend',
]);

export function makeDisplayLabel(element: HTMLElement, source: string) {
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const tag = element.tagName.toLowerCase();
  const classes = Array.from(element.classList);
  if (classes.length > 0) {
    const label = `${tag}.${classes.join('.')}`;
    return label.length <= 40 ? label : `${tag}.${classes[0]}`;
  }

  if (TEXT_TAGS.has(tag) && element.children.length === 0) {
    const text = element.textContent?.replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 40);
  }

  return tag;
}

function buildLayerTree(): LayerNode[] {
  const allElements = Array.from(
    document.querySelectorAll<HTMLElement>(`[${HAWK_EYE_SOURCE_ATTRIBUTE}]`)
  );
  const filtered = allElements.filter((el) => !el.closest('[data-hawk-eye-ui]'));
  const nodes = filtered.map((element) => {
    const instanceKey = createInspectableElementKey(element);
    const source = element.dataset.hawkEyeSource ?? '';

    return {
      element,
      instanceKey: instanceKey ?? '',
      label: makeDisplayLabel(element, source),
      source,
      tagName: element.tagName.toLowerCase(),
      children: [] as LayerNode[],
      depth: 0,
    };
  });

  const nodeMap = new Map<HTMLElement, LayerNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.element, node);
  });

  const rootNodes: LayerNode[] = [];

  nodes.forEach((node) => {
    let parent = node.element.parentElement;
    let parentNode: LayerNode | null = null;

    while (parent) {
      if (parent.closest('[data-hawk-eye-ui]')) {
        break;
      }
      const candidate = nodeMap.get(parent);
      if (candidate) {
        parentNode = candidate;
        break;
      }
      parent = parent.parentElement;
    }

    if (parentNode) {
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  function computeDepth(node: LayerNode, depth: number) {
    node.depth = depth;
    node.children.forEach((child) => computeDepth(child, depth + 1));
  }

  rootNodes.forEach((node) => computeDepth(node, 0));

  return rootNodes;
}

function collectExpandableKeys(nodes: LayerNode[]) {
  const keys = new Set<string>();

  function visit(node: LayerNode) {
    if (node.children.length > 0 && node.instanceKey) {
      keys.add(node.instanceKey);
    }

    node.children.forEach(visit);
  }

  nodes.forEach(visit);
  return keys;
}

function countNodes(nodes: LayerNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

function ChevronIcon() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LayerNodeComponent({
  node,
  selectedInstanceKey,
  onSelectByKey,
  collapsedKeys,
  onToggle,
}: {
  node: LayerNode;
  selectedInstanceKey: string | null;
  onSelectByKey(instanceKey: string): void;
  collapsedKeys: Set<string>;
  onToggle(key: string): void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren ? !collapsedKeys.has(node.instanceKey) : false;
  const isSelected = node.instanceKey === selectedInstanceKey;

  return (
    <>
      <div
        data-depth={node.depth}
        data-hawk-eye-ui="layer-row"
        data-selected={isSelected ? 'true' : 'false'}
        style={{ paddingLeft: `${node.depth * 12}px` }}
      >
        <button
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={hasChildren ? (isExpanded ? 'Collapse layer' : 'Expand layer') : undefined}
          data-expanded={hasChildren ? String(isExpanded) : undefined}
          data-hawk-eye-ui="layer-expand-btn"
          disabled={!hasChildren}
          onClick={() => {
            if (hasChildren) onToggle(node.instanceKey);
          }}
          type="button"
        >
          {hasChildren ? <ChevronIcon /> : null}
        </button>
        <button
          aria-label={`Select layer ${node.label}`}
          aria-pressed={isSelected}
          data-hawk-eye-ui="layer-select-btn"
          data-selected={isSelected ? 'true' : 'false'}
          onClick={() => onSelectByKey(node.instanceKey)}
          type="button"
        >
          <span data-hawk-eye-ui="layer-copy">
            <span data-hawk-eye-ui="layer-label">{node.label}</span>
          </span>
        </button>
      </div>
      {isExpanded &&
        node.children.map((child) => (
          <LayerNodeComponent
            key={child.instanceKey}
            node={child}
            selectedInstanceKey={selectedInstanceKey}
            onSelectByKey={onSelectByKey}
            collapsedKeys={collapsedKeys}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export function LayersPanel({ selectedInstanceKey, onLayerCount, onSelectByKey }: LayersPanelProps) {
  const rootNodes = buildLayerTree();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const totalLayers = countNodes(rootNodes);
  const expandableKeys = collectExpandableKeys(rootNodes);

  useEffect(() => {
    onLayerCount?.(totalLayers);
  }, [totalLayers, onLayerCount]);

  function handleToggle(key: string) {
    if (!expandableKeys.has(key)) {
      return;
    }

    setCollapsedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (rootNodes.length === 0) {
    return <div data-hawk-eye-ui="layers-empty">No inspectable elements yet.</div>;
  }

  return (
    <section data-hawk-eye-ui="layers-section">
      <div data-hawk-eye-ui="layers-tree">
        {rootNodes.map((node) => (
          <LayerNodeComponent
            key={node.instanceKey}
            node={node}
            selectedInstanceKey={selectedInstanceKey}
            onSelectByKey={onSelectByKey}
            collapsedKeys={collapsedKeys}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </section>
  );
}
