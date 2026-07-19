import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSourceDocument } from "@manifest-lens/parser-json";
import { analyzeManifest } from "./index.js";

function readFixture(name: string): string {
  return readFileSync(join(process.cwd(), "fixtures", "manifests", name), "utf8");
}

function analyze(name: string) {
  const source = readFixture(name);
  const document = createSourceDocument(source);
  return analyzeManifest(document);
}

describe("Core pipeline integration", () => {
  it("minimal-mv3.json produces an AnalysisSnapshot with explanations", () => {
    const snapshot = analyze("minimal-mv3.json");

    expect(snapshot.document).toBeDefined();
    expect(snapshot.parse).toBeDefined();
    expect(snapshot.semantic).toBeDefined();
    expect(snapshot.explanationsByNodeId).toBeDefined();

    const explanationCount = Object.keys(snapshot.explanationsByNodeId).length;
    expect(explanationCount).toBeGreaterThan(0);
  });

  it("full-common-mv3.json resolves all common top-level fields", () => {
    const snapshot = analyze("full-common-mv3.json");
    const fields = [
      "manifest_version",
      "name",
      "version",
      "description",
      "permissions",
      "host_permissions",
      "content_scripts",
      "background",
      "action",
      "browser_action",
      "page_action",
      "icons",
      "commands",
      "options_ui",
      "web_accessible_resources",
      "content_security_policy",
      "declarative_net_request",
    ];
    const fieldNodes = snapshot.semantic.nodes.filter((n) => n.kind === "field");

    for (const fieldName of fields) {
      const node = fieldNodes.find((n) => n.kind === "field" && n.fieldName === fieldName);
      expect(node).toBeDefined();
      const explanation = snapshot.explanationsByNodeId[node!.id];
      expect(explanation).toBeDefined();
      expect(explanation!.source.kind).toBe("knowledge");
    }
  });

  it("permissions.json resolves known permission values", () => {
    const snapshot = analyze("permissions.json");
    const permNodes = snapshot.semantic.nodes.filter((n) => n.kind === "permission");

    expect(permNodes.length).toBeGreaterThanOrEqual(4);

    for (const node of permNodes) {
      const explanation = snapshot.explanationsByNodeId[node.id];
      expect(explanation).toBeDefined();
    }

    const tabsNode = permNodes.find((n) => n.kind === "permission" && n.value === "tabs");
    expect(tabsNode).toBeDefined();
    expect(snapshot.explanationsByNodeId[tabsNode!.id]?.title).toBe("tabs Permission");
  });

  it("host-permissions.json resolves host permission items", () => {
    const snapshot = analyze("host-permissions.json");
    const hpNodes = snapshot.semantic.nodes.filter((n) => n.kind === "hostPermission");

    expect(hpNodes.length).toBeGreaterThanOrEqual(3);

    for (const node of hpNodes) {
      const explanation = snapshot.explanationsByNodeId[node.id];
      expect(explanation).toBeDefined();
      expect(explanation!.title).toBe("Host Permission");
    }
  });

  it("nested-content-scripts.json resolves content script fields/items", () => {
    const snapshot = analyze("nested-content-scripts.json");
    const csNodes = snapshot.semantic.nodes.filter((n) => n.kind === "contentScript");

    expect(csNodes.length).toBeGreaterThanOrEqual(1);

    for (const node of csNodes) {
      const explanation = snapshot.explanationsByNodeId[node.id];
      expect(explanation).toBeDefined();
    }

    const matchNodes = snapshot.semantic.nodes.filter((n) => n.kind === "contentScriptMatch");
    expect(matchNodes.length).toBeGreaterThanOrEqual(1);

    for (const node of matchNodes) {
      const explanation = snapshot.explanationsByNodeId[node.id];
      expect(explanation).toBeDefined();
    }
  });

  it("unknown-custom-fields.json produces fallback explanations", () => {
    const snapshot = analyze("unknown-custom-fields.json");
    const unknownNodes = snapshot.semantic.nodes.filter((n) => n.kind === "unknownField");

    expect(unknownNodes.length).toBeGreaterThanOrEqual(1);

    for (const node of unknownNodes) {
      const explanation = snapshot.explanationsByNodeId[node.id];
      expect(explanation).toBeDefined();
      expect(explanation!.source.kind).toBe("fallback");
    }
  });

  it("partial-invalid.json still resolves for recovered nodes", () => {
    const snapshot = analyze("partial-invalid.json");
    const explanationCount = Object.keys(snapshot.explanationsByNodeId).length;

    expect(explanationCount).toBeGreaterThan(0);

    const knownExplanations = Object.values(snapshot.explanationsByNodeId).filter(
      (e) => e.source.kind === "knowledge",
    );
    expect(knownExplanations.length).toBeGreaterThan(0);
  });

  it("snapshot round-trips through JSON.stringify and JSON.parse", () => {
    const snapshot = analyze("full-common-mv3.json");
    const serialized = JSON.stringify(snapshot);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.document).toBeDefined();
    expect(deserialized.parse).toBeDefined();
    expect(deserialized.semantic).toBeDefined();
    expect(deserialized.explanationsByNodeId).toBeDefined();
    expect(typeof deserialized.document.text).toBe("string");

    const explanationValues = Object.values(deserialized.explanationsByNodeId) as Array<Record<string, unknown>>;
    expect(explanationValues.length).toBeGreaterThan(0);

    for (const explanation of explanationValues) {
      expect(explanation.title).toBeDefined();
      expect(explanation.summary).toBeDefined();
      expect(explanation.source).toBeDefined();
    }
  });

  it("snapshot contains no diagnostics, fixes, or health score concepts", () => {
    const snapshot = analyze("full-common-mv3.json");
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain("diagnostic");
    expect(serialized).not.toContain("fix");
    expect(serialized).not.toContain("health");
    expect(serialized).not.toContain("severity");
  });
});
