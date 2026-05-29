import { MarkerType, Position } from "@xyflow/react";

const VIEW_DEPTH = {
  landscape: 1,
  bindings: 1,
  resources: 1,
  validation: 1,
  library: 0,
};

const LEAF_WIDTH = 300;
const LEAF_HEIGHT = 180;
const GROUP_MIN_WIDTH = 360;
const GROUP_MIN_HEIGHT = 260;
const PADDING_X = 48;
const PADDING_Y = 48;
const PADDING_TOP = 92;
const GAP_X = 44;
const GAP_Y = 36;

const LAYOUT_MODES = {
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
  GRID: "grid",
  AUTO_GRID: "auto-grid",
};

export function makeFlowElements(graph, options) {
  const {
    scopeId = graph.root,
    view = "landscape",
    includeDescendants = false,
    showInterfaces = view === "bindings" || view === "validation",
    showResources = view === "resources",
    showSuper = true,
    layoutMode = LAYOUT_MODES.AUTO_GRID,
    spacing = 1.0,
  } = options;

  console.info("[compose-flow] making flow elements", options);

  const instanceById = new Map(graph.instances.map((instance) => [instance.id, instance]));
  const childrenByParent = groupBy(graph.instances, (instance) => instance.parentId ?? "__root__");
  const root = instanceById.get(scopeId) ?? graph.instances[0];

  if (!root) {
    return { nodes: [], edges: [] };
  }

  const maxDepth = includeDescendants ? Number.POSITIVE_INFINITY : (VIEW_DEPTH[view] ?? 1);
  const visibleIds = new Set();
  collectVisible(root.id, 0, maxDepth, childrenByParent, visibleIds);

  const layout = computeLayout(root.id, childrenByParent, visibleIds, layoutMode, spacing);
  assignPositions(root.id, childrenByParent, visibleIds, layout, layoutMode, spacing, 0, 0);

  const nodes = [];
  emitNodes(root.id, null, childrenByParent, visibleIds, layout, instanceById, nodes, {
    showInterfaces,
    showResources,
    compact: view === "landscape",
  });

  const edges = graph.bindings
    .filter((binding) => showSuper || binding.kind !== "super")
    .filter((binding) => visibleIds.has(binding.source.instanceId) && visibleIds.has(binding.target.instanceId))
    .map((binding) => bindingToEdge(binding, { showInterfaces, view }));

  console.info("[compose-flow] flow elements ready", { nodes: nodes.length, edges: edges.length });
  return { nodes, edges };
}

function bindingToEdge(binding, { showInterfaces, view }) {
  const isSuper = binding.kind === "super";

  const edge = {
    id: binding.id,
    source: binding.source.instanceId,
    target: binding.target.instanceId,
    type: "smoothstep",
    label: isSuper ? binding.label : binding.label,
    animated: view === "validation" ? false : isSuper,
    markerEnd: { type: MarkerType.ArrowClosed },
    className: isSuper ? "edge-super" : "edge-binding",
    data: { binding },
  };

  // Only add handle properties if interfaces are shown
  if (showInterfaces) {
    edge.sourceHandle = sourceHandleId(binding.source.interfaceName);
    edge.targetHandle = targetHandleId(binding.target.interfaceName);
  }

  return edge;
}

function emitNodes(id, parentId, childrenByParent, visibleIds, layout, instanceById, out, viewOptions) {
  const instance = instanceById.get(id);
  if (!instance) {
    return;
  }
  const box = layout.get(id);
  const hasChildren = (childrenByParent.get(id) ?? []).some((child) => visibleIds.has(child.id));

  out.push({
    id,
    type: "block",
    parentId: parentId ?? undefined,
    extent: parentId ? "parent" : undefined,
    position: { x: box.x, y: box.y },
    data: {
      ...instance,
      hasVisibleChildren: hasChildren,
      showInterfaces: viewOptions.showInterfaces,
      showResources: viewOptions.showResources,
      compact: viewOptions.compact,
    },
    style: hasChildren
      ? { width: box.width, height: box.height, zIndex: -1 }
      : { width: box.width, minHeight: box.height },
  });

  for (const child of childrenByParent.get(id) ?? []) {
    if (visibleIds.has(child.id)) {
      emitNodes(child.id, id, childrenByParent, visibleIds, layout, instanceById, out, viewOptions);
    }
  }
}

function computeLayout(id, childrenByParent, visibleIds, layoutMode, spacing, layout = new Map()) {
  const children = (childrenByParent.get(id) ?? []).filter((child) => visibleIds.has(child.id));

  if (!children.length) {
    layout.set(id, { width: LEAF_WIDTH, height: LEAF_HEIGHT, x: 0, y: 0 });
    return layout;
  }

  for (const child of children) {
    computeLayout(child.id, childrenByParent, visibleIds, layoutMode, spacing, layout);
  }

  // Apply spacing multiplier to gaps and padding
  const gapX = GAP_X * spacing;
  const gapY = GAP_Y * spacing;
  const paddingX = PADDING_X * spacing;
  const paddingY = PADDING_Y * spacing;
  const paddingTop = PADDING_TOP * spacing;

  let width, height;

  switch (layoutMode) {
    case LAYOUT_MODES.VERTICAL: {
      let maxWidth = 0;
      let totalHeight = paddingTop;
      for (const child of children) {
        const childBox = layout.get(child.id);
        maxWidth = Math.max(maxWidth, childBox.width);
        totalHeight += childBox.height + gapY;
      }
      width = Math.max(GROUP_MIN_WIDTH, paddingX + maxWidth + paddingX);
      height = Math.max(GROUP_MIN_HEIGHT, totalHeight + paddingY - gapY);
      break;
    }

    case LAYOUT_MODES.GRID:
    case LAYOUT_MODES.AUTO_GRID: {
      const cols = layoutMode === LAYOUT_MODES.AUTO_GRID
        ? Math.ceil(Math.sqrt(children.length))
        : Math.min(3, children.length);
      const rows = Math.ceil(children.length / cols);

      let maxChildWidth = 0;
      let maxChildHeight = 0;
      for (const child of children) {
        const childBox = layout.get(child.id);
        maxChildWidth = Math.max(maxChildWidth, childBox.width);
        maxChildHeight = Math.max(maxChildHeight, childBox.height);
      }

      width = Math.max(GROUP_MIN_WIDTH, paddingX + (cols * (maxChildWidth + gapX)) - gapX + paddingX);
      height = Math.max(GROUP_MIN_HEIGHT, paddingTop + (rows * (maxChildHeight + gapY)) - gapY + paddingY);
      break;
    }

    case LAYOUT_MODES.HORIZONTAL:
    default: {
      let totalWidth = paddingX;
      let maxHeight = 0;
      for (const child of children) {
        const childBox = layout.get(child.id);
        totalWidth += childBox.width + gapX;
        maxHeight = Math.max(maxHeight, childBox.height);
      }
      width = Math.max(GROUP_MIN_WIDTH, totalWidth + paddingX - gapX);
      height = Math.max(GROUP_MIN_HEIGHT, paddingTop + maxHeight + gapY);
      break;
    }
  }

  layout.set(id, { width, height, x: 0, y: 0 });
  return layout;
}

function assignPositions(id, childrenByParent, visibleIds, layout, layoutMode, spacing, x, y) {
  const box = layout.get(id);
  box.x = x;
  box.y = y;

  const children = (childrenByParent.get(id) ?? []).filter((child) => visibleIds.has(child.id));

  // Apply spacing multiplier to gaps and padding
  const gapX = GAP_X * spacing;
  const gapY = GAP_Y * spacing;
  const paddingX = PADDING_X * spacing;
  const paddingTop = PADDING_TOP * spacing;

  switch (layoutMode) {
    case LAYOUT_MODES.VERTICAL: {
      let cursorY = paddingTop;
      for (const child of children) {
        const childBox = layout.get(child.id);
        childBox.x = paddingX;
        childBox.y = cursorY;
        cursorY += childBox.height + gapY;
        assignPositions(child.id, childrenByParent, visibleIds, layout, layoutMode, spacing, childBox.x, childBox.y);
      }
      break;
    }

    case LAYOUT_MODES.GRID:
    case LAYOUT_MODES.AUTO_GRID: {
      const cols = layoutMode === LAYOUT_MODES.AUTO_GRID
        ? Math.ceil(Math.sqrt(children.length))
        : Math.min(3, children.length);

      let maxChildWidth = 0;
      let maxChildHeight = 0;
      for (const child of children) {
        const childBox = layout.get(child.id);
        maxChildWidth = Math.max(maxChildWidth, childBox.width);
        maxChildHeight = Math.max(maxChildHeight, childBox.height);
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childBox = layout.get(child.id);
        const col = i % cols;
        const row = Math.floor(i / cols);
        childBox.x = paddingX + col * (maxChildWidth + gapX);
        childBox.y = paddingTop + row * (maxChildHeight + gapY);
        assignPositions(child.id, childrenByParent, visibleIds, layout, layoutMode, spacing, childBox.x, childBox.y);
      }
      break;
    }

    case LAYOUT_MODES.HORIZONTAL:
    default: {
      let cursorX = paddingX;
      for (const child of children) {
        const childBox = layout.get(child.id);
        childBox.x = cursorX;
        childBox.y = paddingTop;
        cursorX += childBox.width + gapX;
        assignPositions(child.id, childrenByParent, visibleIds, layout, layoutMode, spacing, childBox.x, childBox.y);
      }
      break;
    }
  }
}

function collectVisible(id, depth, maxDepth, childrenByParent, out) {
  out.add(id);
  if (depth >= maxDepth) {
    return;
  }
  for (const child of childrenByParent.get(id) ?? []) {
    collectVisible(child.id, depth + 1, maxDepth, childrenByParent, out);
  }
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function sourceHandleId(interfaceName) {
  return `source:${interfaceName}`;
}

export function targetHandleId(interfaceName) {
  return `target:${interfaceName}`;
}

export const HANDLE_POSITIONS = {
  source: Position.Right,
  target: Position.Left,
};
