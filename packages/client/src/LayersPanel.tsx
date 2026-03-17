import { useMemo, useState } from 'react';
import { createInspectableElementKey } from './drafts';

interface LayerNode {
  element: HTMLElement;
  instanceKey: string;
  tagName: string;
  label: string;
  source: string;
  children: LayerNode[];
  depth: number;
}

interface LayersPanelProps {
  selectedInstanceKey: string | null;
  onSelectByKey(instanceKey: string): void;
}

function makeLabel(source: string): string {
  // "src/components/Button.tsx:42:5" → "Button.tsx:42"
  const parts = source.split(':');
  const line = parts[parts.length - 2];
  const file = parts.slice(0, -2).join(':');
  const fileParts = file.split('/');
  const basename = fileParts[fileParts.length - 1] ?? file;
  return `${basename}:${line}`;
}

function buildLayerTree(): LayerNode[] {
  // Get all [data-source] elements
  const allElements = Array.from(document.querySelectorAll<HTMLElement>('[data-source]'));

  // Filter out elements inside [data-hawk-eye-ui]
  const filtered = allElements.filter((el) => !el.closest('[data-hawk-eye-ui]'));

  // Map to LayerNode objects
  const nodes = filtered.map((element) => {
    const instanceKey = createInspectableElementKey(element);
    const tagName = element.tagName.toLowerCase();
    const source = element.dataset.source ?? '';

    return {
      element,
      instanceKey: instanceKey ?? '',
      tagName,
      label: makeLabel(source),
      source,
      children: [] as LayerNode[],
      depth: 0,
    };
  });

  // Build parent-child relationships
  const nodeMap = new Map<HTMLElement, LayerNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.element, node);
  });

  const rootNodes: LayerNode[] = [];

  nodes.forEach((node) => {
    let parent = node.element.parentElement;
    let parentNode: LayerNode | null = null;

    // Find nearest [data-source] ancestor
    while (parent) {
      if (parent.closest('[data-hawk-eye-ui]')) {
        // Stop if we hit the hawk-eye UI
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

  // Compute depth recursively
  function computeDepth(node: LayerNode, depth: number) {
    node.depth = depth;
    node.children.forEach((child) => computeDepth(child, depth + 1));
  }

  rootNodes.forEach((node) => computeDepth(node, 0));

  return rootNodes;
}

function LayerNodeComponent({
  node,
  selectedInstanceKey,
  onSelectByKey,
  expandedKeys,
  onToggle,
}: {
  node: LayerNode;
  selectedInstanceKey: string | null;
  onSelectByKey(instanceKey: string): void;
  expandedKeys: Set<string>;
  onToggle(key: string): void;
}) {
  const isExpanded = expandedKeys.has(node.instanceKey);
  const hasChildren = node.children.length > 0;
  const isSelected = node.instanceKey === selectedInstanceKey;

  return (
    <>
      <div
        data-hawk-eye-ui="layer-row"
        data-selected={isSelected ? 'true' : 'false'}
        onClick={() => onSelectByKey(node.instanceKey)}
        style={{ paddingLeft: `${8 + node.depth * 14}px` }}
      >
        <button
          data-hawk-eye-ui="layer-expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.instanceKey);
          }}
          type="button"
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : ' '}
        </button>
        <span data-hawk-eye-ui="layer-tag">{node.tagName}</span>
        <span data-hawk-eye-ui="layer-source">{node.label}</span>
      </div>
      {isExpanded &&
        node.children.map((child) => (
          <LayerNodeComponent
            key={child.instanceKey}
            node={child}
            selectedInstanceKey={selectedInstanceKey}
            onSelectByKey={onSelectByKey}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export function LayersPanel({ selectedInstanceKey, onSelectByKey }: LayersPanelProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const rootNodes = useMemo(() => buildLayerTree(), []);

  function handleToggle(key: string) {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedKeys(next);
  }

  if (rootNodes.length === 0) {
    return (
      <div style={{ padding: '16px', color: 'var(--he-label)', fontSize: '12px' }}>
        No elements to inspect.
      </div>
    );
  }

  return (
    <div data-hawk-eye-ui="layers-tree">
      {rootNodes.map((node) => (
        <LayerNodeComponent
          key={node.instanceKey}
          node={node}
          selectedInstanceKey={selectedInstanceKey}
          onSelectByKey={onSelectByKey}
          expandedKeys={expandedKeys}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
