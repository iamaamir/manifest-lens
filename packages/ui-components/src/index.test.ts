// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type {
  AnalysisSnapshot,
  Explanation,
  ExplanationId,
  JsonPrimitive,
  ManifestFieldName,
  SemanticNode,
  SemanticNodeBase,
  SemanticNodeId,
  SourceDocument,
  SourceRange,
  SyntaxNodeId,
} from "@manifest-lens/contracts";
import {
  customElementTagName,
  ManifestInspectorElement,
  registerManifestInspector,
} from "./index";

const sid = (id: string) => id as unknown as SyntaxNodeId;
const nid = (id: string) => id as unknown as SemanticNodeId;
const eid = (id: string) => id as unknown as ExplanationId;

const SOURCE = `{
  "name": "Example Extension"
}`;

function range(start: number, end: number): SourceRange {
  return rangeOnLines(start, end, 1, 1);
}

function rangeOnLines(
  start: number,
  end: number,
  startLine: number,
  endLine: number,
): SourceRange {
  return {
    start: { line: startLine, column: 0, offset: start },
    end: { line: endLine, column: 0, offset: end },
  };
}

const doc: SourceDocument = {
  id: "document:test" as SourceDocument["id"],
  language: "json",
  text: SOURCE,
};

function makeExplanation(title: string): Explanation {
  return {
    id: eid(`${title}-id`),
    title,
    summary: `${title} summary`,
    details: [`${title} detail`],
    relatedFields: [],
    examples: [],
    docsLinks: [
      { label: "Docs", url: "https://example.com/docs" },
    ],
    source: { kind: "knowledge", packId: "test" },
  };
}

function makeNode(
  id: SemanticNodeId,
  kind: SemanticNode["kind"],
  sourceRange: SourceRange,
  extra: Partial<Record<string, unknown>> = {},
): SemanticNode {
  const base: SemanticNodeBase = {
    id,
    syntaxNodeId: sid(`s-${id}`),
    ...(extra.parentId ? { parentId: extra.parentId as SemanticNodeId } : {}),
    childIds: [],
    path: [],
    normalizedPath: `/${id}`,
    breadcrumb: [{ label: String(id), path: [] }],
    sourceRange,
    ...(extra.keyRange ? { keyRange: extra.keyRange as SourceRange } : {}),
    ...(extra.valueRange ? { valueRange: extra.valueRange as SourceRange } : {}),
  };
  switch (kind) {
    case "field":
      return { ...base, kind, fieldName: (extra.fieldName as ManifestFieldName) ?? "name" };
    case "unknownField":
      return { ...base, kind, fieldName: (extra.fieldName as string) ?? String(id) };
    case "permission":
    case "hostPermission":
    case "contentScriptMatch":
    case "contentScriptFile":
      return {
        ...base,
        kind,
        value: (extra.value as string) ?? String(id),
        fileKind: (extra.fileKind as "js" | "css") ?? "js",
      };
    case "contentScript":
      return { ...base, kind, index: (extra.index as number) ?? 0 };
    case "contentScriptField":
      return { ...base, kind, fieldName: (extra.fieldName as string) ?? String(id) };
    case "arrayItem":
      return { ...base, kind, ...(extra.value !== undefined ? { value: extra.value as JsonPrimitive } : {}) };
    case "manifest":
      return { ...base, kind };
  }
}

function makeSnapshot(): AnalysisSnapshot {
  const manifestNode = makeNode(nid("manifest"), "manifest", range(0, SOURCE.length));
  const nameNode = makeNode(nid("name"), "field", range(4, 31), {
    fieldName: "name",
    parentId: nid("manifest"),
  });

  return {
    document: doc,
    parse: {
      document: doc,
      root: {
        id: sid("root"),
        kind: "object",
        range: range(0, SOURCE.length),
        path: [],
        children: [],
      },
      errors: [],
    },
    semantic: {
      document: doc,
      parseRootId: sid("root"),
      rootNodeId: nid("manifest"),
      manifestVersion: { kind: "mv3", version: 3 },
      nodes: [manifestNode, nameNode],
    },
    explanationsByNodeId: {
      [nid("manifest")]: makeExplanation("Manifest"),
      [nid("name")]: makeExplanation("Name"),
    },
  };
}

const TWO_FIELD_SOURCE = `{
  "name": "A",
  "customField": "B"
}`;

const twoFieldDoc: SourceDocument = {
  id: "document:two-field" as SourceDocument["id"],
  language: "json",
  text: TWO_FIELD_SOURCE,
};

function makeTwoFieldSnapshot(): AnalysisSnapshot {
  const nameStart = TWO_FIELD_SOURCE.indexOf('"name"');
  const nameEnd = TWO_FIELD_SOURCE.indexOf(",", nameStart);
  const customStart = TWO_FIELD_SOURCE.indexOf('"customField"');
  const customEnd = TWO_FIELD_SOURCE.indexOf('"B"') + 3;

  const manifestNode = makeNode(
    nid("manifest"),
    "manifest",
    range(0, TWO_FIELD_SOURCE.length),
  );
  const nameNode = makeNode(nid("name"), "field", range(nameStart, nameEnd), {
    fieldName: "name",
    parentId: nid("manifest"),
  });
  const customNode = makeNode(
    nid("customField"),
    "unknownField",
    range(customStart, customEnd),
    { fieldName: "customField", parentId: nid("manifest") },
  );

  const nameExplanation = makeExplanation("Name");
  const customExplanation: Explanation = {
    ...makeExplanation("customField"),
    source: { kind: "fallback", reason: "unknown-field" },
  };

  return {
    document: twoFieldDoc,
    parse: {
      document: twoFieldDoc,
      root: {
        id: sid("root"),
        kind: "object",
        range: range(0, TWO_FIELD_SOURCE.length),
        path: [],
        children: [],
      },
      errors: [],
    },
    semantic: {
      document: twoFieldDoc,
      parseRootId: sid("root"),
      rootNodeId: nid("manifest"),
      manifestVersion: { kind: "mv3", version: 3 },
      nodes: [manifestNode, nameNode, customNode],
    },
    explanationsByNodeId: {
      [nid("manifest")]: makeExplanation("Manifest"),
      [nid("name")]: nameExplanation,
      [nid("customField")]: customExplanation,
    },
  };
}

const NESTED_CONTAINER_SOURCE = `{
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "ruleset_1"
      }
    ]
  }
}`;

const nestedContainerDoc: SourceDocument = {
  id: "document:nested-container" as SourceDocument["id"],
  language: "json",
  text: NESTED_CONTAINER_SOURCE,
};

function makeNestedContainerSnapshot(): AnalysisSnapshot {
  const fieldStart = NESTED_CONTAINER_SOURCE.indexOf("  \"declarative_net_request\"");
  const valueStart = NESTED_CONTAINER_SOURCE.indexOf("{", fieldStart);
  const valueEnd = NESTED_CONTAINER_SOURCE.lastIndexOf("}");
  const childStart = NESTED_CONTAINER_SOURCE.indexOf("    \"rule_resources\"");
  const childValueStart = NESTED_CONTAINER_SOURCE.indexOf("[", childStart);
  const childValueEnd = NESTED_CONTAINER_SOURCE.lastIndexOf("]") + 1;

  const manifestNode = makeNode(
    nid("manifest"),
    "manifest",
    rangeOnLines(0, NESTED_CONTAINER_SOURCE.length, 1, 9),
  );
  const dnrNode = makeNode(
    nid("declarative_net_request"),
    "field",
    rangeOnLines(fieldStart, valueEnd, 2, 8),
    {
      fieldName: "declarative_net_request",
      parentId: nid("manifest"),
      valueRange: rangeOnLines(valueStart, valueEnd, 2, 8),
    },
  );
  const ruleResourcesNode = makeNode(
    nid("rule_resources"),
    "unknownField",
    rangeOnLines(childStart, childValueEnd, 3, 7),
    {
      fieldName: "rule_resources",
      parentId: nid("declarative_net_request"),
      valueRange: rangeOnLines(childValueStart, childValueEnd, 3, 7),
    },
  );

  return {
    document: nestedContainerDoc,
    parse: {
      document: nestedContainerDoc,
      root: {
        id: sid("nested-root"),
        kind: "object",
        range: rangeOnLines(0, NESTED_CONTAINER_SOURCE.length, 1, 9),
        path: [],
        children: [],
      },
      errors: [],
    },
    semantic: {
      document: nestedContainerDoc,
      parseRootId: sid("nested-root"),
      rootNodeId: nid("manifest"),
      manifestVersion: { kind: "missing" },
      nodes: [manifestNode, dnrNode, ruleResourcesNode],
    },
    explanationsByNodeId: {
      [nid("manifest")]: makeExplanation("Manifest"),
      [nid("declarative_net_request")]: makeExplanation("Declarative Net Request"),
      [nid("rule_resources")]: makeExplanation("Rule Resources"),
    },
  };
}

function mountInspector(): ManifestInspectorElement {
  const host = document.createElement(customElementTagName) as ManifestInspectorElement;
  document.body.append(host);
  return host;
}

describe("@manifest-lens/ui-components public contract", () => {
  it("exposes the manifest-inspector custom element tag name", () => {
    expect(customElementTagName).toBe("manifest-inspector");
  });

  it("does not throw when registration is invoked in a DOM-capable environment", () => {
    expect(() => registerManifestInspector()).not.toThrow();
    expect(() => registerManifestInspector()).not.toThrow();
    expect(customElements.get(customElementTagName)).toBeDefined();
  });
});

describe("manifest-inspector empty state", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  it("renders a local-first prompt without diagnostics or reports", () => {
    const host = mountInspector();
    const shadow = host.shadowRoot;
    const text = shadow?.textContent ?? "";
    expect(text).toContain("Drop a manifest.json");
    expect(text).toContain(
      "Or paste it anywhere on this page, or click Upload above.",
    );
    expect(text).not.toMatch(/diagnos|fix|health score|report|audit/i);
    host.remove();
  });

  it("renders an SVG bracket glyph in the empty state, not text", () => {
    const host = mountInspector();
    const glyphContainer = host.shadowRoot?.querySelector(".empty-glyph");
    const svg = glyphContainer?.querySelector("svg");

    expect(glyphContainer).not.toBeNull();
    expect(svg).not.toBeNull();
    expect(glyphContainer?.textContent).not.toContain("{ }");
    host.remove();
  });

  it("SVG glyph has correct viewBox and stroke attributes", () => {
    const host = mountInspector();
    const svg = host.shadowRoot?.querySelector(".empty-glyph svg") as SVGSVGElement | null;

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 48 48");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("stroke-width")).toBe("1.5");
    expect(svg?.getAttribute("fill")).toBe("none");
    expect(svg?.getAttribute("stroke-linecap")).toBe("round");
    expect(svg?.getAttribute("stroke-linejoin")).toBe("round");
    host.remove();
  });

  it("SVG glyph contains bracket line elements", () => {
    const host = mountInspector();
    const svg = host.shadowRoot?.querySelector(".empty-glyph svg") as SVGSVGElement | null;
    const lines = svg?.querySelectorAll("line");

    expect(svg).not.toBeNull();
    expect(lines?.length).toBe(6);
    host.remove();
  });

  it("empty-glyph CSS class allows SVG to scale with container", () => {
    const host = mountInspector();
    const styleText = host.shadowRoot?.querySelector("style")?.textContent ?? "";
    const svg = host.shadowRoot?.querySelector(".empty-glyph svg") as SVGSVGElement | null;

    expect(styleText).toContain(".empty-glyph {");
    expect(styleText).toContain("width: 48px;");
    expect(styleText).toContain("height: 48px;");
    expect(styleText).toContain(".empty-glyph svg {");
    expect(styleText).toContain("width: 100%;");
    expect(styleText).toContain("height: 100%;");
    expect(svg).not.toBeNull();
    host.remove();
  });
});

describe("manifest-inspector snapshot rendering", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a tree container after loadSnapshot", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const tree = host.shadowRoot?.querySelector(".tree-container");
    expect(tree).not.toBeNull();
    host.remove();
  });

  it("preserves source text from node ranges", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const tree = host.shadowRoot?.querySelector(".tree-container");
    expect(tree?.textContent).toContain('"name"');
    expect(tree?.textContent).toContain('"Example Extension"');
    host.remove();
  });

  it("keeps decorative line numbers out of the tree-text content", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const tree = host.shadowRoot?.querySelector(".tree-container");
    const gutter = host.shadowRoot?.querySelector(".source-gutter");
    const lineNumbers = host.shadowRoot?.querySelectorAll(".source-gutter-line");

    expect(tree).not.toBeNull();
    expect(tree?.textContent).not.toBeNull();
    expect(gutter?.getAttribute("aria-hidden")).toBe("true");
    expect(lineNumbers?.length).toBe(tree?.querySelectorAll(".tree-row").length);
    expect([...(lineNumbers ?? [])].map((line) => line.getAttribute("data-node-id"))).toEqual([
      "manifest",
      "name",
    ]);
    expect(host.shadowRoot?.querySelector(".source-frame")?.textContent).toContain("11");
    host.remove();
  });

  it("adds lightweight JSON syntax token classes without reserializing source", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const key = host.shadowRoot?.querySelector(".source-token-key");
    const string = host.shadowRoot?.querySelector(".source-token-string");
    const bracket = host.shadowRoot?.querySelector(".source-token-bracket");

    expect(key?.textContent).toBe('"name"');
    expect(string?.textContent).toBe('"Example Extension"');
    expect(bracket).not.toBeNull();
    host.remove();
  });

  it("marks the source gutter row when a tree row is focused or pinned", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    const nameRow = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="name"]',
    ) as HTMLElement;

    region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const focusedLine = host.shadowRoot?.querySelector(".source-gutter-line.is-focused") as HTMLElement;
    expect(focusedLine?.dataset.nodeId).toBe("name");

    nameRow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const pinnedLine = host.shadowRoot?.querySelector(".source-gutter-line.is-pinned") as HTMLElement;
    expect(pinnedLine?.dataset.nodeId).toBe("name");
    host.remove();
  });

  it("keeps gutter markers aligned to one visible row for a multi-line semantic node", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedContainerSnapshot());
    const row = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="declarative_net_request"]',
    ) as HTMLElement;

    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const rows = host.shadowRoot?.querySelectorAll(".tree-row");
    const gutterLines = host.shadowRoot?.querySelectorAll(".source-gutter-line");
    const pinnedLines = host.shadowRoot?.querySelectorAll(".source-gutter-line.is-pinned");

    expect(gutterLines?.length).toBe(rows?.length);
    expect(pinnedLines?.length).toBe(1);
    expect((pinnedLines?.[0] as HTMLElement | undefined)?.dataset.nodeId).toBe(
      "declarative_net_request",
    );
    host.remove();
  });

  it("previews expanded containers with only their original opening delimiter", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedContainerSnapshot());
    const row = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="declarative_net_request"]',
    ) as HTMLElement;
    const value = row.querySelector(".tree-value");

    expect(value?.textContent).toBe("{");
    expect(row.textContent).not.toContain("rule_resources");
    host.remove();
  });

  it("renders tree rows with data-node-id for explainable ranges", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const rows = host.shadowRoot?.querySelectorAll(".tree-row");
    expect(rows?.length).toBeGreaterThanOrEqual(2);
    const ids = [...(rows ?? [])].map((n) => n.getAttribute("data-node-id"));
    expect(ids).toContain("manifest");
    expect(ids).toContain("name");
    host.remove();
  });

  it("does not use positive tabindex on tree rows", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const rows = host.shadowRoot?.querySelectorAll(".tree-row");
    for (const row of rows ?? []) {
      expect(row.getAttribute("tabindex")).not.toBe("1");
    }
    host.remove();
  });

  it("shows an explanation panel for the root node after load", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBe("Manifest");
    host.remove();
  });

  it("uses textContent only, never innerHTML, for source", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    expect(host.shadowRoot?.querySelector(".tree-container")?.innerHTML).not.toContain(
      "<script",
    );
    host.remove();
  });

  it("restores empty state with SVG glyph after clear()", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    host.clear();
    const text = host.shadowRoot?.textContent ?? "";
    expect(text).toContain("Drop a manifest.json");
    
    const svg = host.shadowRoot?.querySelector(".empty-glyph svg");
    expect(svg).not.toBeNull();
    host.remove();
  });

  it("shows accepted drop feedback in the empty state", () => {
    const host = mountInspector();
    host.showDropFeedback("accepted");

    const overlay = host.shadowRoot?.querySelector(".drop-overlay") as HTMLElement | null;
    const overlayText = host.shadowRoot?.querySelector(".drop-overlay-text");
    expect(host.classList.contains("is-dragging")).toBe(true);
    expect(host.dataset.dropFeedback).toBe("accepted");
    expect(overlay).not.toBeNull();
    expect(overlayText?.textContent).toBe("Drop manifest.json to inspect locally");

    host.clearDropFeedback();
    expect(host.classList.contains("is-dragging")).toBe(false);
    host.remove();
  });

  it("shows rejected drop feedback in the loaded state without changing source content", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    host.showDropFeedback("rejected");

    const overlayText = host.shadowRoot?.querySelector(".drop-overlay-text");
    const tree = host.shadowRoot?.querySelector(".tree-container");
    expect(host.dataset.dropFeedback).toBe("rejected");
    expect(overlayText?.textContent).toBe("Drop a JSON manifest file");
    expect(tree?.textContent).toContain("Example Extension");

    host.remove();
  });
});

describe("manifest-inspector interaction", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function nameRow(host: ManifestInspectorElement): HTMLElement | null {
    return host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="name"]',
    ) as HTMLElement | null;
  }

  it("hover previews the explanation of the hovered node", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const row = nameRow(host)!;
    row.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBe("Name");
    host.remove();
  });

  it("click pins the explanation of the clicked node", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const row = nameRow(host)!;
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBe("Name");
    expect(nameRow(host)?.classList.contains("is-pinned")).toBe(true);
    host.remove();
  });

  it("hover leave restores the pinned explanation", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const row = nameRow(host)!;
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    row.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    row.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    host.remove();
  });

  function sourceRegion(host: ManifestInspectorElement): HTMLElement {
    return host.shadowRoot?.querySelector(".source-region") as HTMLElement;
  }

  it("keyboard navigation moves focus and selects a node on Enter", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const region = sourceRegion(host);
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    const pinned = host.shadowRoot?.querySelector(".tree-row.is-pinned");
    expect(pinned).not.toBeNull();
    host.remove();
  });

  it("Escape clears the active selection", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const row = nameRow(host)!;
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    sourceRegion(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    const pinned = host.shadowRoot?.querySelector(".tree-row.is-pinned");
    expect(pinned).toBeNull();
    host.remove();
  });
});

describe("manifest-inspector keyboard reachability", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("exposes a single focusable source region with non-positive tabindex", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.getAttribute("tabindex")).toBe("0");
    host.remove();
  });

  it("does not place a positive tabindex on any focusable element", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const focusables = host.shadowRoot?.querySelectorAll("[tabindex]") ?? [];
    for (const el of focusables) {
      const value = Number(el.getAttribute("tabindex"));
      expect(value).toBeLessThanOrEqual(0);
    }
    host.remove();
  });

  it("provides keyboard instructions referenced by the source region", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    const describedBy = region.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const instructions = host.shadowRoot?.querySelector(`#${describedBy}`);
    expect(instructions?.textContent?.toLowerCase()).toContain("arrow keys");
    host.remove();
  });

  it("keyboard interaction works when the source region receives keydown, not the host", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(host.shadowRoot?.querySelector(".tree-row.is-pinned")).not.toBeNull();
    host.remove();
  });
});

describe("manifest-inspector stable source DOM", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("keeps the same source-region element across hover and click interactions", () => {
    const host = mountInspector();
    host.loadSnapshot(makeTwoFieldSnapshot());
    const regionBefore = host.shadowRoot?.querySelector(".source-region");
    const nameRowBefore = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="name"]',
    );

    nameRowBefore?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    nameRowBefore?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const regionAfter = host.shadowRoot?.querySelector(".source-region");
    const nameRowAfter = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="name"]',
    );

    expect(regionAfter).toBe(regionBefore);
    expect(nameRowAfter).toBe(nameRowBefore);
    host.remove();
  });

  it("updates explanation panel content on interaction without rebuilding source", () => {
    const host = mountInspector();
    host.loadSnapshot(makeTwoFieldSnapshot());
    const treeBefore = host.shadowRoot?.querySelector(".tree-container");

    const custom = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="customField"]',
    ) as HTMLElement;
    custom.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const treeAfter = host.shadowRoot?.querySelector(".tree-container");
    expect(treeAfter).toBe(treeBefore);
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "customField",
    );
    host.remove();
  });
});

describe("manifest-inspector source DOM id uniqueness", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders only unique element ids in the shadow root for tree rows", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const shadow = host.shadowRoot!;
    const allElements = shadow.querySelectorAll("*");
    const ids = [...allElements]
      .map((el) => el.id)
      .filter((id) => id.length > 0);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
    host.remove();
  });

  it("gives every explainable tree-row a unique id", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const rows = [
      ...(host.shadowRoot?.querySelectorAll(".tree-row") ?? []),
    ];
    const ids = rows.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
    host.remove();
  });

  it("points aria-activedescendant at the focused tree row", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );

    const activeDescendant = region.getAttribute("aria-activedescendant");
    expect(activeDescendant).toBeTruthy();
    const representative = host.shadowRoot?.getElementById(activeDescendant!);
    expect(representative).not.toBeNull();
    expect(representative?.classList.contains("is-focused")).toBe(true);
    host.remove();
  });

  it("uses the tree-row as the aria-activedescendant target when focused", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );

    const activeDescendant = region.getAttribute("aria-activedescendant");
    expect(activeDescendant).toBeTruthy();
    const representative = host.shadowRoot?.getElementById(activeDescendant!);
    expect(representative).not.toBeNull();
    expect(representative?.getAttribute("data-node-id")).toBe("name");
    expect(representative?.classList.contains("tree-row")).toBe(true);
    host.remove();
  });

  it("disclosure click does not trigger node selection", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const manifestRow = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="manifest"]',
    ) as HTMLElement;
    const disclosure = manifestRow?.querySelector(".tree-disclosure");
    expect(disclosure).not.toBeNull();
    expect(disclosure).toBeDefined();

    disclosure!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    // After toggling collapse, the manifest row should not be pinned
    expect(manifestRow?.classList.contains("is-pinned")).toBe(false);
    host.remove();
  });
});

describe("manifest-inspector unknown/custom fallback", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("shows fallback explanation for an unknown/custom field", () => {
    const host = mountInspector();
    host.loadSnapshot(makeTwoFieldSnapshot());
    const custom = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="customField"]',
    ) as HTMLElement;
    expect(custom).not.toBeNull();
    custom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "customField",
    );
    host.remove();
  });
});

describe("manifest-inspector pin/hover/restore", () => {
  beforeAll(() => {
    registerManifestInspector();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("pin A, hover B, leave B restores A's explanation and pin", () => {
    const host = mountInspector();
    host.loadSnapshot(makeTwoFieldSnapshot());

    const rowA = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="name"]',
    ) as HTMLElement;
    const rowB = host.shadowRoot?.querySelector(
      '.tree-row[data-node-id="customField"]',
    ) as HTMLElement;

    rowA.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    expect(rowA.classList.contains("is-pinned")).toBe(true);

    rowB.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "customField",
    );

    rowB.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    expect(rowA.classList.contains("is-pinned")).toBe(true);
    host.remove();
  });
});
