import { describe, expect, it } from "vitest";
import { createKnowledgeRegistry, resolveNodeExplanation } from "./index.js";
import type { BreadcrumbSegment, SemanticNode, SemanticNodeId, SourceRange, SyntaxNodeId } from "@manifest-lens/contracts";

function makeNode(overrides: Partial<SemanticNode> & { kind: SemanticNode["kind"] }): SemanticNode {
  const base = {
    id: "test:id:0" as SemanticNodeId,
    syntaxNodeId: "syntax:id:0" as SyntaxNodeId,
    childIds: [] as readonly SemanticNodeId[],
    path: [] as readonly string[],
    normalizedPath: "",
    breadcrumb: [] as const,
    sourceRange: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } } as SourceRange,
  };

  return { ...base, ...overrides } as SemanticNode;
}

describe("KnowledgeRegistry", () => {
  it("contains path entries for all required top-level fields", () => {
    const registry = createKnowledgeRegistry();
    const requiredFields = [
      "manifest",
      "manifest_version",
      "name",
      "version",
      "description",
      "icons",
      "permissions",
      "host_permissions",
      "content_scripts",
      "background",
      "action",
      "browser_action",
      "page_action",
      "options_ui",
      "commands",
      "web_accessible_resources",
      "content_security_policy",
      "declarative_net_request",
    ];

    for (const field of requiredFields) {
      expect(registry.pathEntries[field]).toBeDefined();
    }
  });

  it("contains path entries for content script paths", () => {
    const registry = createKnowledgeRegistry();
    const csPaths = [
      "content_scripts[]",
      "content_scripts[].matches",
      "content_scripts[].matches[]",
      "content_scripts[].js",
      "content_scripts[].js[]",
      "content_scripts[].css",
      "content_scripts[].css[]",
    ];

    for (const path of csPaths) {
      expect(registry.pathEntries[path]).toBeDefined();
    }
  });

  it("contains permission entries for required permissions", () => {
    const registry = createKnowledgeRegistry();
    const requiredPermissions = ["tabs", "activeTab", "storage", "scripting"];

    for (const perm of requiredPermissions) {
      expect(registry.permissionEntries[perm]).toBeDefined();
    }
  });

  it("is serializable through JSON round-trip", () => {
    const registry = createKnowledgeRegistry();
    const serialized = JSON.stringify(registry);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.pathEntries).toBeDefined();
    expect(deserialized.permissionEntries).toBeDefined();
    expect(deserialized.pathEntries.manifest_version.title).toBe("Manifest Version");
    expect(deserialized.permissionEntries.tabs.title).toBe("tabs Permission");
  });
});

describe("Resolver", () => {
  it("resolves specific permission value over generic path match", () => {
    const registry = createKnowledgeRegistry();
    const tabsNode = makeNode({
      kind: "permission",
      value: "tabs",
      normalizedPath: "permissions[]",
    });
    const explanation = resolveNodeExplanation(tabsNode, registry);

    expect(explanation.title).toBe("tabs Permission");
    expect(explanation.source.kind).toBe("knowledge");
  });

  it("resolves known top-level field via path match", () => {
    const registry = createKnowledgeRegistry();
    const fieldNode = makeNode({
      kind: "field",
      fieldName: "manifest_version",
      normalizedPath: "manifest_version",
    });
    const explanation = resolveNodeExplanation(fieldNode, registry);

    expect(explanation.title).toBe("Manifest Version");
    expect(explanation.source.kind).toBe("knowledge");
  });

  it("resolves host permission items", () => {
    const registry = createKnowledgeRegistry();
    const hpNode = makeNode({
      kind: "hostPermission",
      value: "https://example.com/*",
      normalizedPath: "host_permissions[]",
    });
    const explanation = resolveNodeExplanation(hpNode, registry);

    expect(explanation.title).toBe("Host Permission");
    expect(explanation.source.kind).toBe("knowledge");
  });

  it("resolves content script paths", () => {
    const registry = createKnowledgeRegistry();
    const csNode = makeNode({
      kind: "contentScript",
      index: 0,
      normalizedPath: "content_scripts[]",
    });
    const matchFieldNode = makeNode({
      kind: "contentScriptField",
      fieldName: "matches",
      normalizedPath: "content_scripts[].matches",
    });
    const jsFieldNode = makeNode({
      kind: "contentScriptField",
      fieldName: "js",
      normalizedPath: "content_scripts[].js",
    });
    const cssFieldNode = makeNode({
      kind: "contentScriptField",
      fieldName: "css",
      normalizedPath: "content_scripts[].css",
    });

    expect(resolveNodeExplanation(csNode, registry).title).toBe("Content Script Entry");
    expect(resolveNodeExplanation(matchFieldNode, registry).title).toBe("Matches (URL Patterns)");
    expect(resolveNodeExplanation(jsFieldNode, registry).title).toBe("JavaScript Files");
    expect(resolveNodeExplanation(cssFieldNode, registry).title).toBe("CSS Files");
  });

  it("falls back gracefully for unknown top-level fields", () => {
    const registry = createKnowledgeRegistry();
    const unknownNode = makeNode({
      kind: "unknownField",
      fieldName: "x_custom_field",
      normalizedPath: "x_custom_field",
    });
    const explanation = resolveNodeExplanation(unknownNode, registry);

    expect(explanation.source.kind).toBe("fallback");
    expect(explanation.source).toEqual({ kind: "fallback", reason: "unknown-field" });
    expect(explanation.title).toBe("Unknown Field");
  });

  it("falls back gracefully for unknown nested fields", () => {
    const registry = createKnowledgeRegistry();
    const nestedNode = makeNode({
      kind: "unknownField",
      fieldName: "custom_option",
      normalizedPath: "options_ui.custom_option",
    });
    const explanation = resolveNodeExplanation(nestedNode, registry);

    expect(explanation.source.kind).toBe("fallback");
    expect(explanation.source).toEqual({ kind: "fallback", reason: "unknown-field" });
  });

  it("falls back gracefully for unknown permission values", () => {
    const registry = createKnowledgeRegistry();
    const unknownPerm = makeNode({
      kind: "permission",
      value: "unknownPerm",
      normalizedPath: "permissions[]",
    });
    const explanation = resolveNodeExplanation(unknownPerm, registry);

    expect(explanation.source.kind).toBe("fallback");
    expect(explanation.source).toEqual({ kind: "fallback", reason: "unknown-permission" });
  });

  it("falls back gracefully for unknown host permission values", () => {
    const registry = createKnowledgeRegistry();
    const hpNode = makeNode({
      kind: "hostPermission",
      value: "unknown://pattern/*",
      normalizedPath: "host_permissions[]",
    });
    const explanation = resolveNodeExplanation(hpNode, registry);

    expect(explanation.source.kind).toBe("fallback");
    expect(explanation.source).toEqual({ kind: "fallback", reason: "unknown-host-permission" });
    expect(explanation.title).toBe("Unknown Host Permission");
  });

  it("resolves known host permission patterns to knowledge entry", () => {
    const registry = createKnowledgeRegistry();
    const knownPatterns = [
      "https://example.com/*",
      "https://*.example.org/*",
      "<all_urls>",
      "http://*/*",
      "file:///*",
      "ftp://*/*",
    ];

    for (const pattern of knownPatterns) {
      const hpNode = makeNode({
        kind: "hostPermission",
        value: pattern,
        normalizedPath: "host_permissions[]",
      });
      const explanation = resolveNodeExplanation(hpNode, registry);
      expect(explanation.title).toBe("Host Permission");
      expect(explanation.source.kind).toBe("knowledge");
    }
  });

  it("resolver output is deterministic", () => {
    const registry = createKnowledgeRegistry();
    const node = makeNode({
      kind: "field",
      fieldName: "name",
      normalizedPath: "name",
    });
    const result1 = resolveNodeExplanation(node, registry);
    const result2 = resolveNodeExplanation(node, registry);

    expect(result1).toEqual(result2);
  });

  it("produces the same explanation for the same node across calls", () => {
    const registry = createKnowledgeRegistry();
    const node = makeNode({
      kind: "permission",
      value: "storage",
      normalizedPath: "permissions[]",
    });

    for (let i = 0; i < 10; i++) {
      const explanation = resolveNodeExplanation(node, registry);
      expect(explanation.title).toBe("storage Permission");
    }
  });

  it("all explanation entries have required metadata", () => {
    const registry = createKnowledgeRegistry();

    for (const [key, entry] of Object.entries(registry.pathEntries)) {
      expect(entry.id).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.summary).toBeDefined();
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.title).toBe("string");
      expect(typeof entry.summary).toBe("string");
    }

    for (const [key, entry] of Object.entries(registry.permissionEntries)) {
      expect(entry.id).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.summary).toBeDefined();
    }
  });
});
