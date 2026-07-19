import { describe, expect, it } from "vitest";
import type {
  AnalysisSnapshot,
  DocumentId,
  Explanation,
  ExplanationId,
  SemanticNode,
  SemanticNodeId,
  SyntaxNodeId,
  SourceDocument,
  SourceRange,
} from "@mvviewer/contracts";
import {
  createInitialInspectorState,
  getActiveNodeId,
  getNavigableNodeIds,
  inspectorReducer,
  moveFocus,
} from "./index.js";

const sid = (id: string) => id as unknown as SyntaxNodeId;
const nid = (id: string) => id as unknown as SemanticNodeId;
const range: SourceRange = {
  start: { line: 0, column: 0, offset: 0 },
  end: { line: 0, column: 0, offset: 0 },
};

const doc: SourceDocument = {
  id: "" as unknown as DocumentId,
  language: "json",
  text: "{}",
};

function makeExplanation(title: string): Explanation {
  return {
    id: `${title}-id` as unknown as ExplanationId,
    title,
    summary: `${title} summary`,
    details: [],
    relatedFields: [],
    examples: [],
    docsLinks: [],
    source: { kind: "knowledge", packId: "test" },
  };
}

function makeNode(
  kind: "manifest",
  id: SemanticNodeId,
  overrides?: never,
): SemanticNode;
function makeNode(
  kind: "field",
  id: SemanticNodeId,
  overrides?: { fieldName?: string },
): SemanticNode;
function makeNode(
  kind: "unknownField",
  id: SemanticNodeId,
  overrides?: { fieldName?: string },
): SemanticNode;
function makeNode(
  kind: "permission",
  id: SemanticNodeId,
  overrides?: { value?: string },
): SemanticNode;
function makeNode(
  kind: "arrayItem",
  id: SemanticNodeId,
  overrides?: never,
): SemanticNode;
function makeNode(
  kind: "manifest" | "field" | "unknownField" | "permission" | "arrayItem",
  id: SemanticNodeId,
  overrides?: Record<string, string>,
): SemanticNode {
  const base = {
    id,
    syntaxNodeId: sid("s-" + id),
    childIds: [] as readonly SemanticNodeId[],
    path: [] as readonly string[],
    normalizedPath: "/" + id,
    breadcrumb: [] as const,
    sourceRange: range,
    keyRange: undefined as SourceRange | undefined,
    valueRange: undefined as SourceRange | undefined,
  };
  switch (kind) {
    case "manifest":
      return { ...base, kind: "manifest" } as SemanticNode;
    case "field":
      return {
        ...base,
        kind: "field",
        fieldName: overrides?.fieldName ?? "name",
      } as SemanticNode;
    case "unknownField":
      return {
        ...base,
        kind: "unknownField",
        fieldName: overrides?.fieldName ?? "custom",
      } as SemanticNode;
    case "permission":
      return {
        ...base,
        kind: "permission",
        value: overrides?.value ?? "tabs",
      } as SemanticNode;
    case "arrayItem":
      return { ...base, kind: "arrayItem", value: null } as SemanticNode;
  }
}

interface SnapshotOptions {
  nodes?: SemanticNode[];
  explanations?: Record<string, Explanation>;
  rootNodeId?: SemanticNodeId;
}

function makeSnapshot(opts: SnapshotOptions = {}): AnalysisSnapshot {
  const nodes: readonly SemanticNode[] = opts.nodes ?? [
    makeNode("manifest", nid("manifest")),
    makeNode("field", nid("name"), { fieldName: "name" }),
    makeNode("field", nid("version"), { fieldName: "version" }),
    makeNode("field", nid("description"), { fieldName: "description" }),
  ];
  const rootNodeId: SemanticNodeId = opts.rootNodeId ?? nid("manifest");
  const explanations: Record<string, Explanation> =
    opts.explanations ?? {
      manifest: makeExplanation("Manifest"),
      name: makeExplanation("Name"),
      version: makeExplanation("Version"),
      description: makeExplanation("Description"),
    };

  return {
    document: doc,
    parse: {
      document: doc,
      root: {
        id: sid("root"),
        kind: "object" as const,
        range,
        path: [],
        children: [],
      },
      errors: [],
    },
    semantic: {
      document: doc,
      parseRootId: sid("root"),
      rootNodeId,
      manifestVersion: { kind: "mv3", version: 3 },
      nodes,
    },
    explanationsByNodeId: explanations as unknown as AnalysisSnapshot["explanationsByNodeId"],
  };
}

describe("createInitialInspectorState", () => {
  it("returns serializable empty state", () => {
    const state = createInitialInspectorState();
    const json = JSON.stringify(state);
    const parsed = JSON.parse(json);

    expect(parsed.status.kind).toBe("empty");
    expect(parsed.snapshot).toBeNull();
    expect(parsed.selection.kind).toBe("none");
    expect(parsed.focusedNodeId).toBeNull();
  });
});

describe("inspectorReducer", () => {
  describe("snapshot/set", () => {
    it("makes state ready and sets focus to first navigable node", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      expect(state.status).toEqual({ kind: "ready" });
      expect(state.snapshot).toBe(snapshot);
      expect(state.focusedNodeId).toBe(nid("manifest"));
    });

    it("sets focusedNodeId to null when no navigable nodes exist", () => {
      const snapshot = makeSnapshot({ explanations: {} });
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      expect(state.focusedNodeId).toBeNull();
    });
  });

  describe("snapshot/clear", () => {
    it("resets to initial empty state", () => {
      const snapshot = makeSnapshot();
      const initialized = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );
      const cleared = inspectorReducer(initialized, { type: "snapshot/clear" });

      expect(cleared).toEqual(createInitialInspectorState());
    });
  });

  describe("node/hover", () => {
    it("hover previews explanation from no selection", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const hovered = inspectorReducer(state, {
        type: "node/hover",
        nodeId: nid("name"),
      });

      expect(hovered.selection).toEqual({
        kind: "hovered",
        nodeId: nid("name"),
      });
      expect(getActiveNodeId(hovered)).toBe(nid("name"));
    });

    it("ignores non-navigable node IDs", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/hover",
        nodeId: nid("nonexistent"),
      });

      expect(result).toBe(state);
    });

    it("ignores node with explanation but not in semantic.nodes", () => {
      const nodes = [makeNode("manifest", nid("manifest"))];
      const explanations = {
        manifest: makeExplanation("Manifest"),
        extra: makeExplanation("Extra"),
      };
      const snapshot = makeSnapshot({ nodes, explanations, rootNodeId: nid("manifest") });
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/hover",
        nodeId: nid("extra"),
      });

      expect(result).toBe(state);
    });

    it("ignores hover without a snapshot", () => {
      const state = createInitialInspectorState();
      const result = inspectorReducer(state, {
        type: "node/hover",
        nodeId: nid("name"),
      });

      expect(result).toBe(state);
    });
  });

  describe("node/hoverEnd", () => {
    it("restores to none after hovered", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const hovered = inspectorReducer(state, {
        type: "node/hover",
        nodeId: nid("name"),
      });
      const ended = inspectorReducer(hovered, { type: "node/hoverEnd" });

      expect(ended.selection).toEqual({ kind: "none" });
      expect(getActiveNodeId(ended)).toBe(nid("manifest"));
    });

    it("restores pinned node after hover preview", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const pinned = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });
      const preview = inspectorReducer(pinned, {
        type: "node/hover",
        nodeId: nid("version"),
      });
      const ended = inspectorReducer(preview, { type: "node/hoverEnd" });

      expect(ended.selection).toEqual({
        kind: "pinned",
        nodeId: nid("name"),
      });
      expect(getActiveNodeId(ended)).toBe(nid("name"));
    });

    it("no-op when already pinned and not previewing", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const pinned = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });
      const ended = inspectorReducer(pinned, { type: "node/hoverEnd" });

      expect(ended).toBe(pinned);
    });
  });

  describe("node/select", () => {
    it("pins an explanation", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const selected = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });

      expect(selected.selection).toEqual({
        kind: "pinned",
        nodeId: nid("name"),
      });
      expect(selected.focusedNodeId).toBe(nid("name"));
    });

    it("ignores non-navigable node IDs", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("nonexistent"),
      });

      expect(result).toBe(state);
    });

    it("ignores node with explanation but not in semantic.nodes", () => {
      const nodes = [makeNode("manifest", nid("manifest"))];
      const explanations = {
        manifest: makeExplanation("Manifest"),
        extra: makeExplanation("Extra"),
      };
      const snapshot = makeSnapshot({ nodes, explanations, rootNodeId: nid("manifest") });
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("extra"),
      });

      expect(result).toBe(state);
    });

    it("works without a preceding hover (touch/tap)", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("version"),
      });

      expect(result.selection).toEqual({
        kind: "pinned",
        nodeId: nid("version"),
      });
    });
  });

  describe("hover over pinned: restore and update", () => {
    it("hover over another node shows preview, hover end restores pinned", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const pinned = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });

      const preview = inspectorReducer(pinned, {
        type: "node/hover",
        nodeId: nid("version"),
      });

      expect(preview.selection).toEqual({
        kind: "hoverPreview",
        hoveredNodeId: nid("version"),
        pinnedNodeId: nid("name"),
      });
      expect(getActiveNodeId(preview)).toBe(nid("version"));

      const ended = inspectorReducer(preview, { type: "node/hoverEnd" });

      expect(ended.selection).toEqual({
        kind: "pinned",
        nodeId: nid("name"),
      });
      expect(getActiveNodeId(ended)).toBe(nid("name"));
    });

    it("selecting while hover-previewing updates the pinned node", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const pinned = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });

      const preview = inspectorReducer(pinned, {
        type: "node/hover",
        nodeId: nid("version"),
      });

      const selectDuringPreview = inspectorReducer(preview, {
        type: "node/select",
        nodeId: nid("version"),
      });

      expect(selectDuringPreview.selection).toEqual({
        kind: "pinned",
        nodeId: nid("version"),
      });
      expect(getActiveNodeId(selectDuringPreview)).toBe(nid("version"));
    });

    it("hover over same pinned node is a no-op", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const pinned = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });

      const hoverSame = inspectorReducer(pinned, {
        type: "node/hover",
        nodeId: nid("name"),
      });

      expect(hoverSame).toBe(pinned);
    });
  });

  describe("node/clearSelection", () => {
    it("resets hover/pin state", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const selected = inspectorReducer(state, {
        type: "node/select",
        nodeId: nid("name"),
      });
      const cleared = inspectorReducer(selected, {
        type: "node/clearSelection",
      });

      expect(cleared.selection).toEqual({ kind: "none" });
    });
  });

  describe("keyboard navigation", () => {
    it("moves focus next through navigable nodes in semantic order", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      expect(state.focusedNodeId).toBe(nid("manifest"));

      const next1 = moveFocus(state, "next");
      expect(next1.focusedNodeId).toBe(nid("name"));

      const next2 = moveFocus(next1, "next");
      expect(next2.focusedNodeId).toBe(nid("version"));

      const next3 = moveFocus(next2, "next");
      expect(next3.focusedNodeId).toBe(nid("description"));
    });

    it("wraps forward at the end", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const next1 = moveFocus(state, "next");
      const next2 = moveFocus(next1, "next");
      const next3 = moveFocus(next2, "next");

      const wrapped = moveFocus(next3, "next");
      expect(wrapped.focusedNodeId).toBe(nid("manifest"));
    });

    it("moves focus previous through navigable nodes", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const prev = moveFocus(state, "previous");
      expect(prev.focusedNodeId).toBe(nid("description"));
    });

    it("wraps backward at the start", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const fromStart = moveFocus(state, "previous");
      expect(fromStart.focusedNodeId).toBe(nid("description"));

      const wrapAgain = moveFocus(fromStart, "previous");
      expect(wrapAgain.focusedNodeId).toBe(nid("version"));
    });

    it("no-op when no navigable nodes exist", () => {
      const snapshot = makeSnapshot({ explanations: {} });
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const next = moveFocus(state, "next");
      const prev = moveFocus(state, "previous");

      expect(next.focusedNodeId).toBeNull();
      expect(prev.focusedNodeId).toBeNull();
    });

    it("no-op without a snapshot", () => {
      const state = createInitialInspectorState();
      const next = moveFocus(state, "next");
      expect(next).toBe(state);
    });
  });

  describe("node/focus", () => {
    it("sets focusedNodeId directly", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/focus",
        nodeId: nid("version"),
      });

      expect(result.focusedNodeId).toBe(nid("version"));
    });

    it("clears focusedNodeId when null", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/focus",
        nodeId: null,
      });

      expect(result.focusedNodeId).toBeNull();
    });

    it("ignores unknown node ID", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/focus",
        nodeId: nid("nonexistent"),
      });

      expect(result).toBe(state);
      expect(result.focusedNodeId).toBe(nid("manifest"));
    });

    it("ignores non-navigable node ID with explanation but not in semantic.nodes", () => {
      const nodes = [makeNode("manifest", nid("manifest"))];
      const explanations = {
        manifest: makeExplanation("Manifest"),
        extra: makeExplanation("Extra"),
      };
      const snapshot = makeSnapshot({ nodes, explanations, rootNodeId: nid("manifest") });
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );

      const result = inspectorReducer(state, {
        type: "node/focus",
        nodeId: nid("extra"),
      });

      expect(result).toBe(state);
      expect(result.focusedNodeId).toBe(nid("manifest"));
    });

    it("preserves existing focus when target is non-navigable", () => {
      const snapshot = makeSnapshot();
      const state = inspectorReducer(
        createInitialInspectorState(),
        { type: "snapshot/set", snapshot },
      );
      const focused = inspectorReducer(state, {
        type: "node/focus",
        nodeId: nid("version"),
      });

      const result = inspectorReducer(focused, {
        type: "node/focus",
        nodeId: nid("nonexistent"),
      });

      expect(result).toBe(focused);
      expect(result.focusedNodeId).toBe(nid("version"));
    });

    it("no-op without a snapshot when non-null", () => {
      const state = createInitialInspectorState();
      const result = inspectorReducer(state, {
        type: "node/focus",
        nodeId: nid("name"),
      });

      expect(result).toBe(state);
    });
  });
});

describe("getNavigableNodeIds", () => {
  it("returns IDs of nodes that have explanations, in semantic node order", () => {
    const snapshot = makeSnapshot();
    const ids = getNavigableNodeIds(snapshot);

    expect(ids).toEqual([nid("manifest"), nid("name"), nid("version"), nid("description")]);
  });

  it("excludes nodes without explanations", () => {
    const nodes = [
      makeNode("manifest", nid("manifest")),
      makeNode("unknownField", nid("customField"), { fieldName: "custom" }),
    ];
    const explanations = {
      manifest: makeExplanation("Manifest"),
    };
    const snapshot = makeSnapshot({ nodes, explanations, rootNodeId: nid("manifest") });

    const ids = getNavigableNodeIds(snapshot);

    expect(ids).toEqual([nid("manifest")]);
  });
});

describe("getActiveNodeId", () => {
  it("returns focusedNodeId when selection is none", () => {
    const snapshot = makeSnapshot();
    const state = inspectorReducer(
      createInitialInspectorState(),
      { type: "snapshot/set", snapshot },
    );

    expect(getActiveNodeId(state)).toBe(nid("manifest"));
  });

  it("returns root node when selection is none and no focus", () => {
    const snapshot = makeSnapshot();
    const state: ReturnType<typeof inspectorReducer> = {
      ...createInitialInspectorState(),
      status: { kind: "ready" },
      snapshot,
      focusedNodeId: null,
    };

    expect(getActiveNodeId(state)).toBe(nid("manifest"));
  });

  it("returns null when no snapshot loaded", () => {
    expect(getActiveNodeId(createInitialInspectorState())).toBeNull();
  });
});

describe("serialization", () => {
  it("state round-trips through JSON.stringify/JSON.parse", () => {
    const snapshot = makeSnapshot();
    const state = inspectorReducer(
      createInitialInspectorState(),
      { type: "snapshot/set", snapshot },
    );
    const hovered = inspectorReducer(state, {
      type: "node/hover",
      nodeId: nid("name"),
    });

    const json = JSON.stringify(hovered);
    const parsed = JSON.parse(json);

    expect(parsed.status.kind).toBe("ready");
    expect(parsed.selection.kind).toBe("hovered");
    expect(parsed.selection.nodeId).toBe(nid("name"));

    const rehydrated = inspectorReducer(
      parsed as typeof hovered,
      { type: "node/hoverEnd" },
    );
    expect(rehydrated.selection.kind).toBe("none");
  });

  it("actions are serializable", () => {
    const actions = [
      { type: "snapshot/set", snapshot: makeSnapshot() },
      { type: "snapshot/clear" },
      { type: "node/hover", nodeId: nid("name") },
      { type: "node/hoverEnd" },
      { type: "node/select", nodeId: nid("name") },
      { type: "node/clearSelection" },
      { type: "node/focus", nodeId: nid("version") },
      { type: "node/focusNext" },
      { type: "node/focusPrevious" },
    ] as const;

    for (const action of actions) {
      const json = JSON.stringify(action);
      const parsed = JSON.parse(json);
      expect(parsed.type).toBe(action.type);
    }
  });

  it("state contains no diagnostics, fixes, or health score concepts", () => {
    const snapshot = makeSnapshot();
    const state = inspectorReducer(
      createInitialInspectorState(),
      { type: "snapshot/set", snapshot },
    );

    const json = JSON.stringify(state);
    expect(json).not.toContain("diagnostic");
    expect(json).not.toContain("fix");
    expect(json).not.toContain("health");
    expect(json).not.toContain("severity");
  });
});

describe("error status", () => {
  it("can set and serialize error status", () => {
    const state: ReturnType<typeof inspectorReducer> = {
      ...createInitialInspectorState(),
      status: { kind: "error", message: "something went wrong" },
    };

    const json = JSON.stringify(state);
    const parsed = JSON.parse(json);

    expect(parsed.status.kind).toBe("error");
    expect(parsed.status.message).toBe("something went wrong");
  });
});
