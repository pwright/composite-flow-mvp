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
const PADDING_TOP = 92;
const GAP_X = 44;
const GAP_Y = 36;

export function makeFlowElements(graph, options) {
  const {
    scopeId = graph.root,
    view = "landscape",
    includeDescendants = false,
    showInterfaces = view === "bindings" || view === "validation",
    showResources = view === "resources",
    showSuper = true,
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

  const layout = computeLayout(root.id, childrenByParent, visibleIds);
  assignPositions(root.id, childrenByParent, visibleIds, layout, 0, 0);

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
  const sourceHandle = showInterfaces ? sourceHandleId(binding.source.interfaceName) : undefined;
  const targetHandle = showInterfaces ? targetHandleId(binding.target.interfaceName) : undefined;

  return {
    id: binding.id,
    source: binding.source.instanceId,
    target: binding.target.instanceId,
    sourceHandle,
    targetHandle,
    type: "smoothstep",
    label: isSuper ? binding.label : binding.label,
    animated: view === "validation" ? false : isSuper,
    markerEnd: { type: MarkerType.ArrowClosed },
    className: isSuper ? "edge-super" : "edge-binding",
    data: { binding },
  };
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

function computeLayout(id, childrenByParent, visibleIds, layout = new Map()) {
  const children = (childrenByParent.get(id) ?? []).filter((child) => visibleIds.has(child.id));

  if (!children.length) {
    layout.set(id, { width: LEAF_WIDTH, height: LEAF_HEIGHT, x: 0, y: 0 });
    return layout;
  }

  let width = PADDING_X;
  let maxHeight = 0;

  for (const child of children) {
    computeLayout(child.id, childrenByParent, visibleIds, layout);
    const childBox = layout.get(child.id);
    width += childBox.width + GAP_X;
    maxHeight = Math.max(maxHeight, childBox.height);
  }

  width = Math.max(GROUP_MIN_WIDTH, width + PADDING_X - GAP_X);
  const height = Math.max(GROUP_MIN_HEIGHT, PADDING_TOP + maxHeight + GAP_Y);
  layout.set(id, { width, height, x: 0, y: 0 });
  return layout;
}

function assignPositions(id, childrenByParent, visibleIds, layout, x, y) {
  const box = layout.get(id);
  box.x = x;
  box.y = y;

  const children = (childrenByParent.get(id) ?? []).filter((child) => visibleIds.has(child.id));
  let cursorX = PADDING_X;
  for (const child of children) {
    const childBox = layout.get(child.id);
    childBox.x = cursorX;
    childBox.y = PADDING_TOP;
    cursorX += childBox.width + GAP_X;
    assignPositions(child.id, childrenByParent, visibleIds, layout, childBox.x, childBox.y);
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
