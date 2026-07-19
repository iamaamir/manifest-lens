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
} from "@mvviewer/contracts";
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
  return {
    start: { line: 0, column: 0, offset: start },
    end: { line: 0, column: 0, offset: end },
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
    childIds: [],
    path: [],
    normalizedPath: `/${id}`,
    breadcrumb: [{ label: String(id), path: [] }],
    sourceRange,
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
  });
  const customNode = makeNode(
    nid("customField"),
    "unknownField",
    range(customStart, customEnd),
    { fieldName: "customField" },
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

function mountInspector(): ManifestInspectorElement {
  const host = document.createElement(customElementTagName) as ManifestInspectorElement;
  document.body.append(host);
  return host;
}

describe("@mvviewer/ui-components public contract", () => {
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
      "Paste or drop a manifest.json here, or use Upload above.",
    );
    expect(text).toContain("Processing stays local to this browser.");
    expect(text).not.toMatch(/diagnos|fix|health score|report|audit/i);
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

  it("renders preserved source text after loadSnapshot", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());

    const pre = host.shadowRoot?.querySelector("pre.source-pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toBe(SOURCE);
    host.remove();
  });

  it("preserves original formatting including whitespace", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const pre = host.shadowRoot?.querySelector("pre.source-pre");
    expect(pre?.textContent).toContain('\n  "name": "Example Extension"');
    host.remove();
  });

  it("keeps decorative line numbers out of the source-only element text", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const pre = host.shadowRoot?.querySelector("pre.source-pre");
    const gutter = host.shadowRoot?.querySelector(".source-gutter");
    const lineNumbers = host.shadowRoot?.querySelectorAll(".source-gutter-line");

    expect(pre?.textContent).toBe(SOURCE);
    expect(gutter?.getAttribute("aria-hidden")).toBe("true");
    expect([...(lineNumbers ?? [])].map((line) => line.textContent)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(host.shadowRoot?.querySelector(".source-frame")?.textContent).toContain("123");
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
    expect(bracket?.textContent).toBe("{");
    expect(host.shadowRoot?.querySelector("pre.source-pre")?.textContent).toBe(SOURCE);
    host.remove();
  });

  it("marks the source gutter when a line is focused or pinned", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    const nameSpan = host.shadowRoot?.querySelector(
      '.source-node[data-node-id="name"]',
    ) as HTMLElement;

    region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const focusedLine = host.shadowRoot?.querySelector(".source-gutter-line.is-focused");
    expect(focusedLine).not.toBeNull();

    nameSpan.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const pinnedLine = host.shadowRoot?.querySelector(".source-gutter-line.is-pinned");
    expect(pinnedLine).not.toBeNull();
    host.remove();
  });

  it("renders source nodes with data-node-id for explainable ranges", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const nodes = host.shadowRoot?.querySelectorAll(".source-node");
    expect(nodes?.length).toBeGreaterThanOrEqual(2);
    const ids = [...(nodes ?? [])].map((n) => n.getAttribute("data-node-id"));
    expect(ids).toContain("manifest");
    expect(ids).toContain("name");
    host.remove();
  });

  it("does not use positive tabindex on source nodes", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const nodes = host.shadowRoot?.querySelectorAll(".source-node");
    for (const node of nodes ?? []) {
      expect(node.getAttribute("tabindex")).not.toBe("1");
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
    expect(host.shadowRoot?.querySelector("pre.source-pre")?.innerHTML).not.toContain(
      "<script",
    );
    host.remove();
  });

  it("restores empty state after clear()", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    host.clear();
    const text = host.shadowRoot?.textContent ?? "";
    expect(text).toContain("Drop a manifest.json");
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

  function nameSpan(host: ManifestInspectorElement): HTMLElement | null {
    return host.shadowRoot?.querySelector(
      '.source-node[data-node-id="name"]',
    ) as HTMLElement | null;
  }

  it("hover previews the explanation of the hovered node", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const span = nameSpan(host)!;
    span.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBe("Name");
    host.remove();
  });

  it("click pins the explanation of the clicked node", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const span = nameSpan(host)!;
    span.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const title = host.shadowRoot?.querySelector(".explanation-title");
    expect(title?.textContent).toBe("Name");
    expect(nameSpan(host)?.classList.contains("is-pinned")).toBe(true);
    host.remove();
  });

  it("hover leave restores the pinned explanation", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const span = nameSpan(host)!;
    span.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    span.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    span.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
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
    const pinned = host.shadowRoot?.querySelector(".source-node.is-pinned");
    expect(pinned).not.toBeNull();
    host.remove();
  });

  it("Escape clears the active selection", () => {
    const host = mountInspector();
    host.loadSnapshot(makeSnapshot());
    const span = nameSpan(host)!;
    span.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    sourceRegion(host).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    const pinned = host.shadowRoot?.querySelector(".source-node.is-pinned");
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
    expect(host.shadowRoot?.querySelector(".source-node.is-pinned")).not.toBeNull();
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
    const nameSpanBefore = host.shadowRoot?.querySelector(
      '.source-node[data-node-id="name"]',
    );

    nameSpanBefore?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    nameSpanBefore?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const regionAfter = host.shadowRoot?.querySelector(".source-region");
    const nameSpanAfter = host.shadowRoot?.querySelector(
      '.source-node[data-node-id="name"]',
    );

    expect(regionAfter).toBe(regionBefore);
    expect(nameSpanAfter).toBe(nameSpanBefore);
    host.remove();
  });

  it("updates explanation panel content on interaction without rebuilding source", () => {
    const host = mountInspector();
    host.loadSnapshot(makeTwoFieldSnapshot());
    const preBefore = host.shadowRoot?.querySelector("pre.source-pre");

    const custom = host.shadowRoot?.querySelector(
      '.source-node[data-node-id="customField"]',
    ) as HTMLElement;
    custom.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const preAfter = host.shadowRoot?.querySelector("pre.source-pre");
    expect(preAfter).toBe(preBefore);
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

  const NESTED_SOURCE = `{
  "name": "A",
  "permissions": ["tabs", "storage"]
}`;

  const nestedDoc: SourceDocument = {
    id: "document:nested" as SourceDocument["id"],
    language: "json",
    text: NESTED_SOURCE,
  };

  function makeNestedSnapshot(): AnalysisSnapshot {
    const manifestNode = makeNode(
      nid("manifest"),
      "manifest",
      range(0, NESTED_SOURCE.length),
    );
    const nameNode = makeNode(nid("name"), "field", range(4, 15), {
      fieldName: "name",
    });
    const permissionsNode = makeNode(
      nid("permissions"),
      "field",
      range(20, NESTED_SOURCE.length - 1),
      { fieldName: "permissions" },
    );
    const tabsNode = makeNode(
      nid("permissions/tabs"),
      "permission",
      range(33, 39),
      { value: "tabs" },
    );
    const storageNode = makeNode(
      nid("permissions/storage"),
      "permission",
      range(41, 50),
      { value: "storage" },
    );

    return {
      document: nestedDoc,
      parse: {
        document: nestedDoc,
        root: {
          id: sid("root"),
          kind: "object",
          range: range(0, NESTED_SOURCE.length),
          path: [],
          children: [],
        },
        errors: [],
      },
      semantic: {
        document: nestedDoc,
        parseRootId: sid("root"),
        rootNodeId: nid("manifest"),
        manifestVersion: { kind: "mv3", version: 3 },
        nodes: [
          manifestNode,
          nameNode,
          permissionsNode,
          tabsNode,
          storageNode,
        ],
      },
      explanationsByNodeId: {
        [nid("manifest")]: makeExplanation("Manifest"),
        [nid("name")]: makeExplanation("Name"),
        [nid("permissions")]: makeExplanation("Permissions"),
        [nid("permissions/tabs")]: makeExplanation("tabs"),
        [nid("permissions/storage")]: makeExplanation("storage"),
      },
    };
  }

  it("renders only unique element ids in the shadow root for nested/overlapping ranges", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedSnapshot());

    const shadow = host.shadowRoot!;
    const allElements = shadow.querySelectorAll("*");
    const ids = [...allElements]
      .map((el) => el.id)
      .filter((id) => id.length > 0);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
    host.remove();
  });

  it("gives every explainable source-node a unique id", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedSnapshot());
    const spans = [
      ...(host.shadowRoot?.querySelectorAll(".source-node") ?? []),
    ];
    const ids = spans.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
    host.remove();
  });

  it("points aria-activedescendant at the deterministic representative id for a node", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedSnapshot());

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

  it("prefers non-structural text as the representative for nodes that have it", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedSnapshot());

    const nameRepresentative = host.shadowRoot?.querySelector(
      '.source-node.is-representative[data-node-id="name"]',
    );
    const permissionsRepresentative = host.shadowRoot?.querySelector(
      '.source-node.is-representative[data-node-id="permissions"]',
    );

    expect(nameRepresentative?.classList.contains("is-structural")).toBe(false);
    expect(nameRepresentative?.textContent).toContain("name");
    expect(permissionsRepresentative?.classList.contains("is-structural")).toBe(false);
    expect(permissionsRepresentative?.textContent).toContain("permissions");
    host.remove();
  });

  it("uses the non-structural representative as aria-activedescendant when focused", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedSnapshot());

    const region = host.shadowRoot?.querySelector(".source-region") as HTMLElement;
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    region.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );

    const activeDescendant = region.getAttribute("aria-activedescendant");
    expect(activeDescendant).toBeTruthy();
    const representative = host.shadowRoot?.getElementById(activeDescendant!);
    expect(representative).not.toBeNull();
    expect(representative?.getAttribute("data-node-id")).toBe("permissions");
    expect(representative?.classList.contains("is-representative")).toBe(true);
    expect(representative?.classList.contains("is-structural")).toBe(false);
    host.remove();
  });

  it("ignores hover and click on non-representative structural source fragments", () => {
    const host = mountInspector();
    host.loadSnapshot(makeNestedSnapshot());

    const structural = host.shadowRoot?.querySelector(
      ".source-node.is-structural:not(.is-representative)",
    ) as HTMLElement;
    expect(structural).not.toBeNull();

    structural.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    structural.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Manifest",
    );
    expect(structural.classList.contains("is-pinned")).toBe(false);
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
      '.source-node[data-node-id="customField"]',
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

    const spanA = host.shadowRoot?.querySelector(
      '.source-node[data-node-id="name"]',
    ) as HTMLElement;
    const spanB = host.shadowRoot?.querySelector(
      '.source-node[data-node-id="customField"]',
    ) as HTMLElement;

    spanA.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    expect(spanA.classList.contains("is-pinned")).toBe(true);

    spanB.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "customField",
    );

    spanB.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(host.shadowRoot?.querySelector(".explanation-title")?.textContent).toBe(
      "Name",
    );
    expect(spanA.classList.contains("is-pinned")).toBe(true);
    host.remove();
  });
});
