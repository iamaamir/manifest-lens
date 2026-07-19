import type {
  AnalysisSnapshot,
  Explanation,
  SemanticNode,
  SemanticNodeId,
  SourceRange,
} from "@mvviewer/contracts";

export type InspectorStatus =
  | { readonly kind: "empty" }
  | { readonly kind: "ready" }
  | { readonly kind: "error"; readonly message: string };

export type SelectionState =
  | { readonly kind: "none" }
  | { readonly kind: "hovered"; readonly nodeId: SemanticNodeId }
  | { readonly kind: "pinned"; readonly nodeId: SemanticNodeId }
  | {
      readonly kind: "hoverPreview";
      readonly hoveredNodeId: SemanticNodeId;
      readonly pinnedNodeId: SemanticNodeId;
    };

export interface InspectorState {
  readonly status: InspectorStatus;
  readonly snapshot: AnalysisSnapshot | null;
  readonly selection: SelectionState;
  readonly focusedNodeId: SemanticNodeId | null;
}

export type InspectorAction =
  | { readonly type: "snapshot/set"; readonly snapshot: AnalysisSnapshot }
  | { readonly type: "snapshot/clear" }
  | { readonly type: "node/hover"; readonly nodeId: SemanticNodeId }
  | { readonly type: "node/hoverEnd" }
  | { readonly type: "node/select"; readonly nodeId: SemanticNodeId }
  | { readonly type: "node/clearSelection" }
  | { readonly type: "node/focus"; readonly nodeId: SemanticNodeId | null }
  | { readonly type: "node/focusNext" }
  | { readonly type: "node/focusPrevious" };

export function createInitialInspectorState(): InspectorState {
  return {
    status: { kind: "empty" },
    snapshot: null,
    selection: { kind: "none" },
    focusedNodeId: null,
  };
}

function isNavigableNode(
  snapshot: AnalysisSnapshot,
  nodeId: SemanticNodeId,
): boolean {
  return (
    nodeId in snapshot.explanationsByNodeId
    && snapshot.semantic.nodes.some((n) => n.id === nodeId)
  );
}

function getRootNodeId(snapshot: AnalysisSnapshot): SemanticNodeId | null {
  const rootId = snapshot.semantic.rootNodeId;
  if (isNavigableNode(snapshot, rootId)) {
    return rootId;
  }
  return null;
}

export function getNavigableNodeIds(
  snapshot: AnalysisSnapshot,
): readonly SemanticNodeId[] {
  return snapshot.semantic.nodes
    .filter((n) => n.id in snapshot.explanationsByNodeId)
    .map((n) => n.id);
}

export function getActiveNodeId(state: InspectorState): SemanticNodeId | null {
  if (!state.snapshot) return null;

  switch (state.selection.kind) {
    case "none":
      return state.focusedNodeId ?? getRootNodeId(state.snapshot);
    case "hovered":
      return state.selection.nodeId;
    case "pinned":
      return state.selection.nodeId;
    case "hoverPreview":
      return state.selection.hoveredNodeId;
  }
}

export function inspectorReducer(
  state: InspectorState,
  action: InspectorAction,
): InspectorState {
  switch (action.type) {
    case "snapshot/set": {
      const navigableIds = getNavigableNodeIds(action.snapshot);
      const firstFocus: SemanticNodeId | null =
        navigableIds.length > 0 ? navigableIds[0]! : null;
      return {
        status: { kind: "ready" },
        snapshot: action.snapshot,
        selection: { kind: "none" },
        focusedNodeId: firstFocus,
      };
    }

    case "snapshot/clear":
      return createInitialInspectorState();

    case "node/hover": {
      if (!state.snapshot) return state;
      if (!isNavigableNode(state.snapshot, action.nodeId)) return state;

      switch (state.selection.kind) {
        case "none":
          return { ...state, selection: { kind: "hovered", nodeId: action.nodeId } };
        case "hovered":
          return action.nodeId === state.selection.nodeId
            ? state
            : { ...state, selection: { kind: "hovered", nodeId: action.nodeId } };
        case "pinned":
          return action.nodeId === state.selection.nodeId
            ? state
            : {
                ...state,
                selection: {
                  kind: "hoverPreview",
                  hoveredNodeId: action.nodeId,
                  pinnedNodeId: state.selection.nodeId,
                },
              };
        case "hoverPreview":
          return action.nodeId === state.selection.hoveredNodeId
            ? state
            : {
                ...state,
                selection: {
                  kind: "hoverPreview",
                  hoveredNodeId: action.nodeId,
                  pinnedNodeId: state.selection.pinnedNodeId,
                },
              };
      }
    }

    case "node/hoverEnd": {
      if (!state.snapshot) return state;

      switch (state.selection.kind) {
        case "none":
        case "pinned":
          return state;
        case "hovered":
          return { ...state, selection: { kind: "none" } };
        case "hoverPreview":
          return {
            ...state,
            selection: {
              kind: "pinned",
              nodeId: state.selection.pinnedNodeId,
            },
          };
      }
    }

    case "node/select": {
      if (!state.snapshot) return state;
      if (!isNavigableNode(state.snapshot, action.nodeId)) return state;

      return {
        ...state,
        selection: { kind: "pinned", nodeId: action.nodeId },
        focusedNodeId: action.nodeId,
      };
    }

    case "node/clearSelection":
      return {
        ...state,
        selection: { kind: "none" },
      };

    case "node/focus":
      if (action.nodeId !== null) {
        if (!state.snapshot || !isNavigableNode(state.snapshot, action.nodeId)) {
          return state;
        }
      }
      return {
        ...state,
        focusedNodeId: action.nodeId,
      };

    case "node/focusNext":
    case "node/focusPrevious": {
      if (!state.snapshot) return state;
      const navigableIds = getNavigableNodeIds(state.snapshot);
      if (navigableIds.length === 0) return state;

      const currentIndex = state.focusedNodeId
        ? navigableIds.indexOf(state.focusedNodeId)
        : -1;

      let nextIndex: number;
      if (action.type === "node/focusNext") {
        nextIndex =
          currentIndex < 0 || currentIndex >= navigableIds.length - 1
            ? 0
            : currentIndex + 1;
      } else {
        nextIndex =
          currentIndex <= 0
            ? navigableIds.length - 1
            : currentIndex - 1;
      }

      return {
        ...state,
        focusedNodeId: navigableIds[nextIndex]!,
      };
    }
  }
}

export function moveFocus(
  state: InspectorState,
  direction: "next" | "previous",
): InspectorState {
  return inspectorReducer(state, {
    type: direction === "next" ? "node/focusNext" : "node/focusPrevious",
  });
}

export function getSemanticNodeById(
  snapshot: AnalysisSnapshot,
  nodeId: SemanticNodeId,
): SemanticNode | undefined {
  return snapshot.semantic.nodes.find((node) => node.id === nodeId);
}

export function getActiveExplanation(
  state: InspectorState,
): Explanation | null {
  if (!state.snapshot) return null;
  const activeId = getActiveNodeId(state);
  if (!activeId) return null;
  return state.snapshot.explanationsByNodeId[activeId] ?? null;
}

function containsOffset(range: SourceRange, offset: number): boolean {
  return range.start.offset <= offset && offset < range.end.offset;
}

function rangeLength(range: SourceRange): number {
  return range.end.offset - range.start.offset;
}

export function findSmallestExplainableNodeAtOffset(
  snapshot: AnalysisSnapshot,
  offset: number,
): SemanticNode | undefined {
  const explainable = snapshot.semantic.nodes.filter(
    (node) => node.id in snapshot.explanationsByNodeId,
  );
  const containing = explainable.filter((node) =>
    containsOffset(node.sourceRange, offset),
  );
  const sorted = [...containing].sort(
    (left, right) => rangeLength(left.sourceRange) - rangeLength(right.sourceRange),
  );
  return sorted[0];
}

export interface TreeRowInfo {
  readonly nodeId: SemanticNodeId;
  readonly depth: number;
  readonly childCount: number;
  readonly guideDepths: readonly number[];
  readonly siblingIndex: number;
  readonly totalSiblings: number;
  readonly parentId: SemanticNodeId | undefined;
  readonly isContainer: boolean;
}

export function buildFlatTree(
  snapshot: AnalysisSnapshot,
): TreeRowInfo[] {
  const explainableNodes = snapshot.semantic.nodes.filter(
    (n) => n.id in snapshot.explanationsByNodeId,
  );
  if (explainableNodes.length === 0) return [];

  const nodeMap = new Map<SemanticNodeId, SemanticNode>();
  for (const node of explainableNodes) {
    nodeMap.set(node.id, node);
  }

  const childrenByParent = new Map<
    SemanticNodeId | undefined,
    SemanticNode[]
  >();
  for (const node of explainableNodes) {
    const parentKey =
      node.parentId && nodeMap.has(node.parentId)
        ? node.parentId
        : undefined;
    const group = childrenByParent.get(parentKey) ?? [];
    group.push(node);
    childrenByParent.set(parentKey, group);
  }

  const depthCache = new Map<SemanticNodeId, number>();
  function getDepth(nodeId: SemanticNodeId): number {
    const cached = depthCache.get(nodeId);
    if (cached !== undefined) return cached;
    const node = nodeMap.get(nodeId);
    if (!node || !node.parentId) {
      depthCache.set(nodeId, 0);
      return 0;
    }
    const d = getDepth(node.parentId) + 1;
    depthCache.set(nodeId, d);
    return d;
  }

  const result: TreeRowInfo[] = [];

  function computeGuideDepths(nodeId: SemanticNodeId): number[] {
    const guides: number[] = [];
    const nodeDepth = getDepth(nodeId);
    if (nodeDepth <= 0) return [];

    let current: SemanticNode | undefined = nodeMap.get(nodeId);
    if (!current) return [];

    for (let level = nodeDepth - 1; level >= 0; level -= 1) {
      if (!current) break;

      const pid: SemanticNodeId | undefined = current.parentId;
      const parent: SemanticNode | undefined = pid ? nodeMap.get(pid) : undefined;
      if (!parent) break;

      const siblings: SemanticNode[] = childrenByParent.get(parent.id) ?? [];
      const siblingIndex = siblings.findIndex((s) => s.id === current!.id);

      if (siblingIndex >= 0 && siblingIndex < siblings.length - 1) {
        guides.push(level);
      }

      current = parent;
    }

    return guides.sort((a, b) => a - b);
  }

  function visit(node: SemanticNode): void {
    const depth = getDepth(node.id);
    const children = childrenByParent.get(node.id) ?? [];
    const childCount = children.length;
    const siblings = node.parentId
      ? childrenByParent.get(node.parentId) ?? [node]
      : [node];
    const siblingIndex = siblings.findIndex((s) => s.id === node.id);

    result.push({
      nodeId: node.id,
      depth,
      childCount,
      guideDepths: computeGuideDepths(node.id),
      siblingIndex,
      totalSiblings: siblings.length,
      parentId: node.parentId
        ? nodeMap.has(node.parentId)
          ? node.parentId
          : undefined
        : undefined,
      isContainer: childCount > 0,
    });

    for (const child of children) {
      visit(child);
    }
  }

  const roots = childrenByParent.get(undefined) ?? [];
  for (const root of roots) {
    visit(root);
  }

  return result;
}
