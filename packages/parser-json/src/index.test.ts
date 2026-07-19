import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSourceDocument, createSourceRangeIndex, flattenSyntaxTree, parseJsonDocument } from "./index";
import type { ParseSnapshot, SyntaxNode } from "@manifest-lens/contracts";

function readFixture(name: string): string {
  return readFileSync(join(process.cwd(), "fixtures", "manifests", name), "utf8");
}

function parseFixture(name: string): ParseSnapshot {
  return parseJsonDocument(createSourceDocument(readFixture(name)));
}

function findNodeByPath(snapshot: ParseSnapshot, path: readonly string[]): SyntaxNode | undefined {
  return flattenSyntaxTree(snapshot.root).find((node) => pathEquals(node.path, path));
}

function pathEquals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function sourceForNode(source: string, node: SyntaxNode): string {
  return source.slice(node.range.start.offset, node.range.end.offset);
}

function valueKindForProperty(snapshot: ParseSnapshot, path: readonly string[]): SyntaxNode["kind"] | undefined {
  const node = findNodeByPath(snapshot, path);

  if (node?.kind !== "property") {
    return undefined;
  }

  return node.children[0]?.kind;
}

describe("parseJsonDocument", () => {
  it("preserves original source text and parses a minimal MV3 manifest", () => {
    const source = readFixture("minimal-mv3.json");
    const snapshot = parseJsonDocument(createSourceDocument(source));

    expect(snapshot.document.text).toBe(source);
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.root.kind).toBe("document");
    expect(snapshot.root.range.start.offset).toBe(0);
    expect(snapshot.root.range.end.offset).toBe(source.length);
  });

  it("creates property nodes for top-level manifest fields with key and value ranges", () => {
    const source = readFixture("minimal-mv3.json");
    const snapshot = parseJsonDocument(createSourceDocument(source));
    const manifestVersion = findNodeByPath(snapshot, ["manifest_version"]);

    expect(manifestVersion?.kind).toBe("property");

    if (manifestVersion?.kind !== "property") {
      throw new Error("manifest_version property not found");
    }

    expect(source.slice(manifestVersion.keyRange.start.offset, manifestVersion.keyRange.end.offset)).toBe(
      '"manifest_version"',
    );
    expect(manifestVersion.valueRange).toBeDefined();
    expect(
      manifestVersion.valueRange
        ? source.slice(manifestVersion.valueRange.start.offset, manifestVersion.valueRange.end.offset)
        : undefined,
    ).toBe("3");
    expect(sourceForNode(source, manifestVersion)).toContain('"manifest_version": 3');
  });

  it("creates precise syntax nodes for JSON primitive kinds", () => {
    const snapshot = parseFixture("all-json-types.json");

    expect(findNodeByPath(snapshot, ["string"])?.kind).toBe("property");
    expect(valueKindForProperty(snapshot, ["string"])).toBe("string");
    expect(valueKindForProperty(snapshot, ["number"])).toBe("number");
    expect(valueKindForProperty(snapshot, ["boolean"])).toBe("boolean");
    expect(valueKindForProperty(snapshot, ["nullValue"])).toBe("null");
    expect(valueKindForProperty(snapshot, ["array"])).toBe("array");
    expect(valueKindForProperty(snapshot, ["object"])).toBe("object");
  });

  it("creates array item paths and ranges for permission strings", () => {
    const source = readFixture("permissions.json");
    const snapshot = parseJsonDocument(createSourceDocument(source));
    const tabs = findNodeByPath(snapshot, ["permissions", "0"]);
    const storage = findNodeByPath(snapshot, ["permissions", "1"]);
    const activeTab = findNodeByPath(snapshot, ["permissions", "2"]);

    expect(tabs?.kind).toBe("string");
    expect(storage?.kind).toBe("string");
    expect(activeTab?.kind).toBe("string");
    expect(tabs && sourceForNode(source, tabs)).toBe('"tabs"');
    expect(storage && sourceForNode(source, storage)).toBe('"storage"');
    expect(activeTab && sourceForNode(source, activeTab)).toBe('"activeTab"');
  });

  it("creates nested paths for content script fields and array items", () => {
    const snapshot = parseFixture("nested-content-scripts.json");

    expect(findNodeByPath(snapshot, ["content_scripts", "0"])?.kind).toBe("object");
    expect(findNodeByPath(snapshot, ["content_scripts", "0", "matches"])?.kind).toBe("property");
    expect(findNodeByPath(snapshot, ["content_scripts", "0", "matches", "0"])?.kind).toBe("string");
    expect(findNodeByPath(snapshot, ["content_scripts", "0", "js", "0"])?.kind).toBe("string");
    expect(findNodeByPath(snapshot, ["content_scripts", "0", "run_at"])?.kind).toBe("property");
  });

  it("range index returns the smallest node containing an offset", () => {
    const source = readFixture("permissions.json");
    const snapshot = parseJsonDocument(createSourceDocument(source));
    const index = createSourceRangeIndex(snapshot);
    const offsetInsideTabs = source.indexOf("tabs") + 1;
    const node = index.findSmallestContaining(offsetInsideTabs);

    expect(node?.kind).toBe("string");
    expect(node?.path).toEqual(["permissions", "0"]);
  });

  it("range index handles property keys, half-open end offsets, and out-of-bounds offsets", () => {
    const source = readFixture("permissions.json");
    const snapshot = parseJsonDocument(createSourceDocument(source));
    const index = createSourceRangeIndex(snapshot);
    const permissionsProperty = findNodeByPath(snapshot, ["permissions"]);

    if (permissionsProperty?.kind !== "property") {
      throw new Error("permissions property not found");
    }

    const offsetInsideKey = source.indexOf("permissions") + 1;
    const offsetAtPropertyEnd = permissionsProperty.range.end.offset;

    expect(index.findSmallestContaining(offsetInsideKey)?.path).toEqual(["permissions"]);
    expect(index.findSmallestContaining(offsetAtPropertyEnd)?.id).not.toBe(permissionsProperty.id);
    expect(index.findSmallestContaining(-1)).toBeUndefined();
    expect(index.findSmallestContaining(source.length + 1)).toBeUndefined();
  });

  it("returns parse errors, recovered nodes, and preserved source for partial invalid JSON", () => {
    const source = readFixture("partial-invalid.json");
    const snapshot = parseJsonDocument(createSourceDocument(source));

    expect(snapshot.document.text).toBe(source);
    expect(snapshot.errors.length).toBeGreaterThan(0);
    expect(snapshot.root.kind).toBe("document");
    expect(findNodeByPath(snapshot, ["manifest_version"])?.kind).toBe("property");
    expect(findNodeByPath(snapshot, ["permissions", "0"])?.kind).toBe("string");
  });

  it("returns serializable parse errors for invalid JSON", () => {
    const snapshot = parseFixture("partial-invalid.json");
    const roundTripped = JSON.parse(JSON.stringify(snapshot)) as ParseSnapshot;

    expect(roundTripped.errors.length).toBeGreaterThan(0);
    expect(roundTripped.errors[0]?.range.start.offset).toEqual(expect.any(Number));
  });

  it("treats comments and trailing commas as unsupported JSON errors", () => {
    const withComment = parseJsonDocument(createSourceDocument("{\n  // comment\n  \"manifest_version\": 3\n}\n"));
    const withTrailingComma = parseJsonDocument(createSourceDocument("{\n  \"manifest_version\": 3,\n}\n"));

    expect(withComment.errors.length).toBeGreaterThan(0);
    expect(withTrailingComma.errors.length).toBeGreaterThan(0);
  });

  it("creates deterministic syntax node IDs for the same source", () => {
    const source = readFixture("permissions.json");
    const first = parseJsonDocument(createSourceDocument(source));
    const second = parseJsonDocument(createSourceDocument(source));

    expect(findNodeByPath(first, ["permissions", "0"])?.id).toBe(findNodeByPath(second, ["permissions", "0"])?.id);
    expect(findNodeByPath(first, ["manifest_version"])?.id).toBe(findNodeByPath(second, ["manifest_version"])?.id);
  });

  it("returns a JSON-serializable parse snapshot", () => {
    const snapshot = parseFixture("nested-content-scripts.json");
    const roundTripped = JSON.parse(JSON.stringify(snapshot)) as ParseSnapshot;

    expect(roundTripped.document.text).toBe(snapshot.document.text);
    expect(roundTripped.root.kind).toBe("document");
    expect(roundTripped.errors).toEqual([]);
  });
});
