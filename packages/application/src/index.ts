import type {
  AnalysisSnapshot,
  SemanticNodeId,
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
